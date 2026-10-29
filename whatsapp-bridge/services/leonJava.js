const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { Sticker } = require("wa-sticker-formatter");

function iniciarLeonJava(sock) {
    let processoJava = null;
    let encerramentoSolicitado = false;
    let javaEncerrado = false;
    let temporizadorReinicioJava = null;

    let respostaAtual = "";
    let bufferSaidaJava = "";

    let destinatarioAtual = null;
    let mencionadosAtuais = [];
    let mensagemCitadaAtual = null;

    let destinatarioProcessamento = null;
    let mencionadosProcessamento = [];
    let mensagemCitadaProcessamento = null;
    let mensagemContextualProcessamento = null;

    let stickerAtual = null;
    let textoStickerAtual = null;
    let imagemAtual = null;
    let gifAtual = null;

    let filaRequisicoes = [];
    let processandoRequisicao = false;
    let finalizandoRequisicao = false;

    // =========================================================
    // MENÇÕES
    // =========================================================

    function normalizarJidMencao(jid) {
        if (typeof jid !== "string" || !jid.includes("@")) {
            return null;
        }

        const partes = jid.split("@");

        if (partes.length !== 2 || !partes[0] || !partes[1]) {
            return null;
        }

        const identificador = partes[0].split(":")[0];
        const servidor = partes[1];

        if (!identificador || servidor === "g.us") {
            return null;
        }

        return `${identificador}@${servidor}`;
    }

    function prepararMencionados(destinatario, mencionados = []) {
        const validos = [
            ...new Set(
                (Array.isArray(mencionados) ? mencionados : [])
                    .map(normalizarJidMencao)
                    .filter(Boolean)
            )
        ];

        if (validos.length > 0) {
            return validos;
        }

        if (
            typeof destinatario === "string" &&
            (
                destinatario.endsWith("@s.whatsapp.net") ||
                destinatario.endsWith("@lid")
            )
        ) {
            const jid = normalizarJidMencao(destinatario);
            return jid ? [jid] : [];
        }

        return [];
    }

    function adicionarMencaoSolicitante(texto, mencionados) {
        if (
            typeof texto !== "string" ||
            !texto.trim() ||
            !Array.isArray(mencionados) ||
            mencionados.length === 0
        ) {
            return texto;
        }

        const jid = normalizarJidMencao(mencionados[0]);

        if (!jid) {
            return texto;
        }

        const identificador = jid.split("@")[0];
        const marcador = "__LEON_MENTION__";
        const textoLimpo = texto.trim();

        if (textoLimpo.includes(marcador)) {
            return textoLimpo.replaceAll(marcador, `@${identificador}`);
        }

        if (textoLimpo.includes(`@${identificador}`)) {
            return textoLimpo;
        }

        return `@${identificador} ${textoLimpo}`;
    }

    async function enviarTexto(
        destinatario,
        texto,
        mencionados = [],
        mensagemCitada = null
    ) {
        if (typeof texto !== "string" || !texto.trim()) {
            return;
        }

        const conteudo = {
            text: adicionarMencaoSolicitante(texto, mencionados)
        };

        if (mencionados.length > 0) {
            conteudo.mentions = mencionados;
        }

        const opcoes = {};

        if (mensagemCitada) {
            opcoes.quoted = mensagemCitada;
        }

        await sock.sendMessage(destinatario, conteudo, opcoes);
    }

    // =========================================================
    // FIGURINHAS
    // =========================================================

    function criarSticker(caminho, qualidade) {
        return new Sticker(caminho, {
            pack: "Leon Revil BOT",
            author: "Leon Revil",
            id: crypto.randomBytes(16).toString("hex"),
            categories: ["👮🏻"],
            type: "full",
            quality: qualidade
        });
    }

    async function garantirMetadataSticker(caminhoSticker) {
        if (!fs.existsSync(caminhoSticker)) {
            return false;
        }

        const limite = 500 * 1024;

        for (const qualidade of [70, 60, 50, 40]) {
            try {
                const sticker = criarSticker(caminhoSticker, qualidade);
                const resultado = await sticker.build();

                if (resultado.length > limite) {
                    continue;
                }

                fs.writeFileSync(caminhoSticker, resultado);
                return true;
            } catch (erro) {
                console.error("[LEON] Erro ao preparar figurinha:", erro);
            }
        }

        return false;
    }

    async function apagarArquivoTemporario(caminho, tipo) {
        if (!caminho) {
            return;
        }

        try {
            if (fs.existsSync(caminho)) {
                fs.unlinkSync(caminho);
                console.log(`[LEON] ${tipo} temporário removido.`);
            }
        } catch (erro) {
            console.error(
                `[LEON] Erro ao apagar ${tipo.toLowerCase()}:`,
                erro
            );
        }
    }

    // =========================================================
    // PROTOCOLO JAVA -> NODE.JS
    // =========================================================

    function processarLinhaJava(linha) {
        linha = linha.replace(/\r$/, "");

        if (linha.startsWith("__LEON_STICKER_TEXT__ ")) {
            textoStickerAtual = linha.substring(
                "__LEON_STICKER_TEXT__ ".length
            );
            return;
        }

        if (linha.startsWith("__LEON_STICKER__ ")) {
            stickerAtual = linha.substring("__LEON_STICKER__ ".length);
            return;
        }

        if (linha.startsWith("__LEON_IMAGE_RESPONSE__ ")) {
            imagemAtual = linha.substring(
                "__LEON_IMAGE_RESPONSE__ ".length
            );
            return;
        }

        if (linha.startsWith("__LEON_GIF_RESPONSE__ ")) {
            gifAtual = linha.substring(
                "__LEON_GIF_RESPONSE__ ".length
            );
            return;
        }

        if (linha === "__LEON_END__") {
            if (finalizandoRequisicao) {
                return;
            }

            finalizandoRequisicao = true;

            finalizarRequisicao()
                .catch(erro => {
                    console.error("[LEON] Erro ao finalizar requisição:", erro);
                    concluirRequisicao();
                })
                .finally(() => {
                    finalizandoRequisicao = false;
                    processarProximaRequisicao();
                });

            return;
        }

        respostaAtual += linha + "\n";
    }

    function processarSaidaJava(dados) {
        bufferSaidaJava += dados.toString();

        const linhas = bufferSaidaJava.split("\n");
        bufferSaidaJava = linhas.pop();

        for (const linha of linhas) {
            processarLinhaJava(linha);
        }
    }

    // =========================================================
    // FINALIZAÇÃO DAS REQUISIÇÕES
    // =========================================================

    async function finalizarRequisicao() {
        const destinatario = destinatarioProcessamento;
        const mencionados = mencionadosProcessamento;

        if (!destinatario) {
            limparEstadoRequisicao();
            processandoRequisicao = false;
            return;
        }

        if (imagemAtual) {
            const caminho = imagemAtual;
            const texto = respostaAtual.trim();

            imagemAtual = null;
            respostaAtual = "";

            try {
                if (texto) {
                    await enviarTexto(
                        destinatario,
                        texto,
                        mencionados
                    );
                }

                await sock.sendMessage(destinatario, {
                    image: { url: caminho }
                });
            } catch (erro) {
                console.error("[LEON] Erro ao enviar imagem:", erro);
            } finally {
                await apagarArquivoTemporario(caminho, "Imagem");
            }

            concluirRequisicao();
            return;
        }

        if (gifAtual) {
            const caminho = gifAtual;
            const texto = respostaAtual.trim();

            gifAtual = null;
            respostaAtual = "";

            try {
                if (texto) {
                    await enviarTexto(
                        destinatario,
                        texto,
                        mencionados
                    );
                }

                await sock.sendMessage(destinatario, {
                    video: { url: caminho },
                    gifPlayback: true
                });
            } catch (erro) {
                console.error("[LEON] Erro ao enviar vídeo:", erro);
            } finally {
                await apagarArquivoTemporario(caminho, "Vídeo");
            }

            concluirRequisicao();
            return;
        }

        if (stickerAtual) {
            const caminho = stickerAtual;
            const texto = textoStickerAtual || respostaAtual.trim();

            stickerAtual = null;
            textoStickerAtual = null;
            respostaAtual = "";

            try {
                // Se a formatação falhar, ainda tentamos enviar o arquivo original.
                await garantirMetadataSticker(caminho);

                if (texto) {
                    await enviarTexto(
                        destinatario,
                        texto,
                        mencionados
                    );
                }

                await sock.sendMessage(destinatario, {
                    sticker: fs.readFileSync(caminho)
                });
            } catch (erro) {
                console.error("[LEON] Erro ao enviar figurinha:", erro);
            } finally {
                await apagarArquivoTemporario(caminho, "Figurinha");
            }

            concluirRequisicao();
            return;
        }

        let resposta = respostaAtual.trim();



        respostaAtual = "";

        try {
            if (resposta) {
                await enviarTexto(
                    destinatario,
                    resposta,
                    mencionados,
                    mensagemCitadaProcessamento
                );
            }
        } catch (erro) {
            console.error("[LEON] Erro ao enviar resposta:", erro);
        }

        concluirRequisicao();
    }

    function concluirRequisicao() {
        limparEstadoRequisicao();
        processandoRequisicao = false;
    }

    function limparEstadoRequisicao() {
        destinatarioProcessamento = null;
        mencionadosProcessamento = [];
        mensagemCitadaProcessamento = null;
        mensagemContextualProcessamento = null;

        respostaAtual = "";
        stickerAtual = null;
        textoStickerAtual = null;
        imagemAtual = null;
        gifAtual = null;
    }

    // =========================================================
    // FILA NODE.JS -> JAVA
    // =========================================================

    function processarProximaRequisicao() {
        if (
            processandoRequisicao ||
            finalizandoRequisicao ||
            filaRequisicoes.length === 0
        ) {
            return;
        }

        if (
            !processoJava ||
            !processoJava.stdin ||
            !processoJava.stdin.writable
        ) {
            return;
        }

        const requisicao = filaRequisicoes.shift();

        processandoRequisicao = true;

        destinatarioProcessamento = requisicao.destinatario;
        mencionadosProcessamento = requisicao.mencionados ?? [];
        mensagemCitadaProcessamento = requisicao.mensagemCitada ?? null;
        mensagemContextualProcessamento = null;

        const marcador = "__LEON_CONTEXTUAL__:";

        if (
            typeof requisicao.texto === "string" &&
            requisicao.texto.startsWith(marcador)
        ) {
            try {
                mensagemContextualProcessamento = Buffer.from(
                    requisicao.texto.substring(marcador.length),
                    "base64"
                ).toString("utf8").trim() || null;
            } catch {
                mensagemContextualProcessamento = null;
            }
        }

        respostaAtual = "";
        stickerAtual = null;
        textoStickerAtual = null;
        imagemAtual = null;
        gifAtual = null;

        try {
            processoJava.stdin.write(`${requisicao.texto}\n`, erro => {
                if (!erro) {
                    return;
                }

                console.error("[LEON] Erro ao enviar requisição ao Java:", erro);

                concluirRequisicao();
                processarProximaRequisicao();
            });
        } catch (erro) {
            console.error("[LEON] Falha ao escrever no Java:", erro);
            concluirRequisicao();
            processarProximaRequisicao();
        }
    }

    function definirDestinatario(
        destinatario,
        mencionados = [],
        mensagemCitada = null
    ) {
        destinatarioAtual = destinatario;

        mencionadosAtuais = prepararMencionados(
            destinatario,
            mencionados
        );

        mensagemCitadaAtual = mensagemCitada ?? null;
    }

    function enviarParaJava(texto) {
        if (typeof texto !== "string" || !destinatarioAtual) {
            console.error("[LEON] Requisição sem texto ou destinatário válido.");
            return;
        }

        filaRequisicoes.push({
            destinatario: destinatarioAtual,
            texto,
            mencionados: [...mencionadosAtuais],
            mensagemCitada: mensagemCitadaAtual
        });

        processarProximaRequisicao();
    }

    // =========================================================
    // PROCESSO JAVA
    // =========================================================

    function iniciarJava() {
        if (javaEncerrado || processoJava) {
            return;
        }

        temporizadorReinicioJava = null;

        processoJava = spawn(
            "java",
            ["-Dstdout.encoding=UTF-8", "-Dstderr.encoding=UTF-8", "-Dfile.encoding=UTF-8", "-cp", path.resolve(__dirname, "../../build/classes"), "LeonBridge"],
            {
                cwd: __dirname,
                stdio: ["pipe", "pipe", "pipe"]
            }
        );

        processoJava.stdout.on("data", processarSaidaJava);

        processoJava.stderr.on("data", dados => {
            console.error("[LEON JAVA]", dados.toString().trimEnd());
        });

        processoJava.on("spawn", () => {
            console.log("[LEON] Processo Java iniciado.");
            processarProximaRequisicao();
        });

        processoJava.on("error", erro => {
            console.error("[LEON] Falha ao iniciar o Java:", erro);
        });

        processoJava.on("close", codigo => {
            console.log("[LEON] Processo Java encerrado. Código:", codigo);

            processoJava = null;
            bufferSaidaJava = "";

            // Não mantém uma requisição bloqueada caso o processo caia.
            if (processandoRequisicao) {
                concluirRequisicao();
            }

            if (encerramentoSolicitado || javaEncerrado) {
                encerramentoSolicitado = false;
                return;
            }

            temporizadorReinicioJava = setTimeout(iniciarJava, 3000);
        });
    }

    function matarJava() {
        javaEncerrado = true;

        if (temporizadorReinicioJava !== null) {
            clearTimeout(temporizadorReinicioJava);
            temporizadorReinicioJava = null;
        }

        if (processoJava) {
            encerramentoSolicitado = true;
            processoJava.kill();
        }
    }

    const api = {
        definirDestinatario,
        enviarParaJava,
        kill: matarJava,
        stdin: {
            write: enviarParaJava
        }
    };

    iniciarJava();

    return api;
}

module.exports = {
    iniciarLeonJava
};