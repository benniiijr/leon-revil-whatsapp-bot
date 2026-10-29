const fs = require("fs");
const path = require("path");

const {
    iniciarMediaHandler
} = require("./mediaHandler");

const {
    definirBemVindo,
    bemVindoAtivo
} = require("./welcomeTracker");

function iniciarMessageHandler(sock, leonJava) {
    const mensagensProcessadas = new Map();

    const LIMITE_MENSAGENS = 5000;
    const RETENCAO_MENSAGENS = 30 * 60 * 1000;

    const arquivoAntiLink = path.join(
        __dirname,
        "antilinkgp.json"
    );

    let gruposAntiLink = {};

    try {
        if (fs.existsSync(arquivoAntiLink)) {
            const dados = JSON.parse(
                fs.readFileSync(arquivoAntiLink, "utf8")
            );

            if (
                dados &&
                typeof dados === "object" &&
                !Array.isArray(dados)
            ) {
                gruposAntiLink = dados;
            }
        }
    } catch (erro) {
        console.error(
            "[LEON] Erro ao carregar configurações anti-link:",
            erro
        );
    }

    function salvarAntiLink() {
        const temporario = `${arquivoAntiLink}.tmp`;

        fs.writeFileSync(
            temporario,
            JSON.stringify(gruposAntiLink, null, 2) + "\n"
        );

        fs.renameSync(temporario, arquivoAntiLink);
    }

    function normalizarJid(jid) {
        if (typeof jid !== "string" || !jid) {
            return null;
        }

        return jid
            .replace(/:\d+(?=@)/, "")
            .toLowerCase();
    }

    function aliasesParticipante(participante) {
        return [
            participante?.id,
            participante?.lid,
            participante?.phoneNumber
        ]
            .map(normalizarJid)
            .filter(Boolean);
    }

    function localizarParticipante(metadata, identificadores) {
        const procurados = new Set(
            identificadores
                .map(normalizarJid)
                .filter(Boolean)
        );

        return (metadata.participants ?? []).find(participante =>
            aliasesParticipante(participante).some(alias =>
                procurados.has(alias)
            )
        );
    }

    function ehGrupo(jid) {
        return typeof jid === "string" &&
            jid.endsWith("@g.us");
    }

    function ehPrivado(jid) {
        return typeof jid === "string" && (
            jid.endsWith("@s.whatsapp.net") ||
            jid.endsWith("@lid")
        );
    }

    function obterConteudo(mensagem) {
        let conteudo = mensagem.message;

        // Desembrulha mensagens encapsuladas pelo WhatsApp.
        for (let i = 0; i < 5 && conteudo; i++) {
            if (conteudo.ephemeralMessage?.message) {
                conteudo = conteudo.ephemeralMessage.message;
                continue;
            }

            if (conteudo.documentWithCaptionMessage?.message) {
                conteudo = conteudo.documentWithCaptionMessage.message;
                continue;
            }

            if (conteudo.viewOnceMessage?.message) {
                conteudo = conteudo.viewOnceMessage.message;
                continue;
            }

            if (conteudo.viewOnceMessageV2?.message) {
                conteudo = conteudo.viewOnceMessageV2.message;
                continue;
            }

            if (conteudo.viewOnceMessageV2Extension?.message) {
                conteudo = conteudo.viewOnceMessageV2Extension.message;
                continue;
            }

            break;
        }

        return conteudo;
    }

    function obterTexto(conteudo) {
        return (
            conteudo?.conversation ??
            conteudo?.extendedTextMessage?.text ??
            conteudo?.imageMessage?.caption ??
            conteudo?.videoMessage?.caption ??
            conteudo?.documentMessage?.caption ??
            conteudo?.documentMessage?.fileName ??
            ""
        ).trim();
    }

    function obterContexto(conteudo) {
        return (
            conteudo?.extendedTextMessage?.contextInfo ??
            conteudo?.imageMessage?.contextInfo ??
            conteudo?.videoMessage?.contextInfo ??
            conteudo?.stickerMessage?.contextInfo ??
            conteudo?.documentMessage?.contextInfo ??
            null
        );
    }

    function obterIdentificadoresRemetente(mensagem) {
        return [
            mensagem.key?.participant,
            mensagem.key?.participantAlt,
            mensagem.key?.remoteJidAlt,
            mensagem.key?.remoteJid
        ].filter(Boolean);
    }

    function obterAlvo(mensagem, contexto) {
        const mencionados = contexto?.mentionedJid ?? [];

        if (mencionados.length === 1) {
            return mencionados[0];
        }

        if (mencionados.length > 1) {
            return { erro: "MULTIPLOS" };
        }

        const participanteRespondido =
            contexto?.participant ??
            contexto?.remoteJid;

        if (participanteRespondido) {
            return participanteRespondido;
        }

        return null;
    }

    async function obterMetadata(grupo) {
        return sock.groupMetadata(grupo);
    }

    async function usuarioEhAdmin(mensagem) {
        const grupo = mensagem.key.remoteJid;

        if (!ehGrupo(grupo)) {
            return false;
        }

        try {
            const metadata = await obterMetadata(grupo);

            const participante = localizarParticipante(
                metadata,
                obterIdentificadoresRemetente(mensagem)
            );

            return [
                "admin",
                "superadmin"
            ].includes(participante?.admin);
        } catch (erro) {
            console.error(
                "[LEON] Erro ao verificar administrador:",
                erro
            );

            return false;
        }
    }

    async function verificarAcessoAdmin(mensagem) {
        const grupo = mensagem.key.remoteJid;

        if (!ehGrupo(grupo)) {
            await sock.sendMessage(grupo, {
                text: "🔒 Esse comando só funciona em grupos."
            });

            return false;
        }

        if (!(await usuarioEhAdmin(mensagem))) {
            await sock.sendMessage(grupo, {
                text:
                    "🔒 *Acesso negado.*\n\n" +
                    "Esse comando é exclusivo dos administradores."
            });

            return false;
        }

        return true;
    }

    function enviarParaJava(destinatario, texto, mensagemOriginal = null, mentions = []) {
        leonJava.definirDestinatario(
            destinatario,
            mentions,
            mensagemOriginal
        );

        leonJava.stdin.write(texto + "\n");
    }

    async function processarMenuAdm(mensagem) {
        const grupo = mensagem.key.remoteJid;

        if (!(await verificarAcessoAdmin(mensagem))) {
            return true;
        }

        await sock.sendMessage(grupo, {
            text:
                "*LEON REVIL — ADMINISTRAÇÃO*\n\n" +

                "╭ 👑 *GERENCIAMENTO*\n" +
                "│\n" +
                "│ 🔨 `/ban @membro` — Remove participante\n" +
                "│ 📜 `/regras` — Mostra as regras do grupo\n" +
                "╰────────────\n\n" +

                "╭ ⚙️ *CONFIGURAÇÕES*\n" +
                "│\n" +
                "│ 👋 `/bemvindo on` — Ativa boas-vindas\n" +
                "│ 👋 `/bemvindo off` — Desativa boas-vindas\n" +
                "│ 🔗 `/antilinkgp on` — Bloqueia convites de grupos\n" +
                "│ 🔗 `/antilinkgp off` — Desativa essa proteção\n" +
                "╰────────────\n\n" +

                "`/menu` — Menu geral\n\n" +
                "Apenas administradores podem usar os comandos administrativos."
        });

        return true;
    }

    async function processarBan(mensagem, contexto) {
        const grupo = mensagem.key.remoteJid;

        if (!(await verificarAcessoAdmin(mensagem))) {
            return true;
        }

        const alvo = obterAlvo(mensagem, contexto);

        if (alvo?.erro === "MULTIPLOS") {
            await sock.sendMessage(grupo, {
                text: "⚠️ Mencione apenas um participante por vez."
            });

            return true;
        }

        if (!alvo) {
            await sock.sendMessage(grupo, {
                text:
                    "🔨 Para remover alguém, mencione a pessoa ou responda à mensagem dela.\n\n" +
                    "Exemplo: `/ban @membro`"
            });

            return true;
        }

        try {
            const metadata = await obterMetadata(grupo);

            const executor = localizarParticipante(
                metadata,
                obterIdentificadoresRemetente(mensagem)
            );

            const leon = localizarParticipante(metadata, [
                sock.user?.id,
                sock.user?.lid
            ]);

            const participanteAlvo = localizarParticipante(
                metadata,
                [alvo]
            );

            if (!["admin", "superadmin"].includes(executor?.admin)) {
                await sock.sendMessage(grupo, {
                    text: "🔒 Você precisa ser administrador para usar esse comando."
                });

                return true;
            }

            if (!["admin", "superadmin"].includes(leon?.admin)) {
                await sock.sendMessage(grupo, {
                    text: "⚠️ Preciso ser administrador do grupo para remover participantes."
                });

                return true;
            }

            if (!participanteAlvo) {
                await sock.sendMessage(grupo, {
                    text: "⚠️ Não encontrei esse participante no grupo."
                });

                return true;
            }

            if (["admin", "superadmin"].includes(participanteAlvo.admin)) {
                await sock.sendMessage(grupo, {
                    text: "Não vou remover um administrador por esse comando."
                });

                return true;
            }

            const leonEhAlvo = aliasesParticipante(participanteAlvo)
                .some(alias =>
                    aliasesParticipante(leon ?? {}).includes(alias)
                );

            if (leonEhAlvo) {
                await sock.sendMessage(grupo, {
                    text: "Não vou me expulsar daqui."
                });

                return true;
            }

            await sock.groupParticipantsUpdate(
                grupo,
                [participanteAlvo.id],
                "remove"
            );

            await sock.sendMessage(grupo, {
                text:
                    "🔨 *Remoção solicitada.*\n\n" +
                    "O WhatsApp recebeu o pedido para remover o participante."
            });

            console.log(
                "[LEON] Solicitação de remoção:",
                participanteAlvo.id,
                "Grupo:",
                grupo
            );
        } catch (erro) {
            console.error("[LEON] Erro no /ban:", erro);

            await sock.sendMessage(grupo, {
                text:
                    "⚠️ Não consegui remover o participante. " +
                    "Verifique minhas permissões de administrador."
            });
        }

        return true;
    }

    async function processarRegras(mensagem) {
        const grupo = mensagem.key.remoteJid;

        if (!(await verificarAcessoAdmin(mensagem))) {
            return true;
        }

        try {
            const metadata = await obterMetadata(grupo);
            const descricao = metadata.desc?.trim();

            await sock.sendMessage(grupo, {
                text: descricao
                    ? `📜 *Regras do grupo:*\n\n${descricao}`
                    : "📜 Este grupo ainda não tem regras definidas na descrição."
            });
        } catch (erro) {
            console.error("[LEON] Erro ao consultar regras:", erro);

            await sock.sendMessage(grupo, {
                text: "⚠️ Não consegui consultar as regras do grupo."
            });
        }

        return true;
    }

    async function processarBemVindo(mensagem, texto) {
        const grupo = mensagem.key.remoteJid;

        if (!(await verificarAcessoAdmin(mensagem))) {
            return true;
        }

        const partes = texto.trim().split(/\s+/);
        const opcao = partes[1]?.toLowerCase();

        if (!["on", "off"].includes(opcao)) {
            await sock.sendMessage(grupo, {
                text: "Use `/bemvindo on` ou `/bemvindo off`."
            });

            return true;
        }

        const ativo = opcao === "on";
        const estadoAtual = bemVindoAtivo(grupo);

        if (estadoAtual === ativo) {
            await sock.sendMessage(grupo, {
                text: ativo
                    ? "👋 As boas-vindas já estão ativadas."
                    : "👋 As boas-vindas já estão desativadas."
            });

            return true;
        }

        try {
            definirBemVindo(grupo, ativo);

            await sock.sendMessage(grupo, {
                text: ativo
                    ? "👋 *Boas-vindas ativadas!* Os novos participantes receberão uma mensagem."
                    : "👋 *Boas-vindas desativadas.*"
            });
        } catch (erro) {
            console.error("[LEON] Erro ao alterar boas-vindas:", erro);

            await sock.sendMessage(grupo, {
                text: "⚠️ Não consegui salvar a configuração de boas-vindas."
            });
        }

        return true;
    }

    async function processarAntiLinkComando(mensagem, acao) {
        const grupo = mensagem.key.remoteJid;

        if (!ehGrupo(grupo)) {
            await sock.sendMessage(grupo, {
                text: "🔒 Esse comando só funciona em grupos."
            });

            return true;
        }

        let metadata;

        try {
            metadata = await obterMetadata(grupo);
        } catch (erro) {
            console.error("[LEON] Erro ao consultar grupo:", erro);

            await sock.sendMessage(grupo, {
                text: "⚠️ Não consegui consultar as permissões do grupo."
            });

            return true;
        }

        const executor = localizarParticipante(
            metadata,
            obterIdentificadoresRemetente(mensagem)
        );

        if (!["admin", "superadmin"].includes(executor?.admin)) {
            await sock.sendMessage(grupo, {
                text: "🔒 Apenas administradores podem configurar o anti-link."
            });

            return true;
        }

        if (!acao) {
            const ativo = gruposAntiLink[grupo] === true;

            await sock.sendMessage(grupo, {
                text:
                    `🔗 Anti-link de convites: *${ativo ? "ATIVADO" : "DESATIVADO"}*.\n\n` +
                    "Use `/antilinkgp on` ou `/antilinkgp off`."
            });

            return true;
        }

        const anterior = gruposAntiLink[grupo] === true;

        if (acao === "on") {
            gruposAntiLink[grupo] = true;
        } else {
            delete gruposAntiLink[grupo];
        }

        try {
            salvarAntiLink();
        } catch (erro) {
            if (anterior) {
                gruposAntiLink[grupo] = true;
            } else {
                delete gruposAntiLink[grupo];
            }

            console.error("[LEON] Erro ao salvar anti-link:", erro);

            await sock.sendMessage(grupo, {
                text: "⚠️ Não consegui salvar a configuração do anti-link."
            });

            return true;
        }

        await sock.sendMessage(grupo, {
            text: acao === "on"
                ? "🔒 Anti-link de convites ativado neste grupo."
                : "🔓 Anti-link de convites desativado neste grupo."
        });

        return true;
    }

    async function moderarConvite(mensagem, grupo) {
        let metadata;

        try {
            metadata = await obterMetadata(grupo);
        } catch (erro) {
            console.error("[LEON] Erro ao consultar grupo para moderação:", erro);
            return;
        }

        const remetente = localizarParticipante(
            metadata,
            obterIdentificadoresRemetente(mensagem)
        );

        if (!remetente) {
            console.warn(
                "[LEON] Remetente não identificado; nenhuma punição aplicada."
            );
            return;
        }

        // Administradores não são punidos por este filtro.
        if (["admin", "superadmin"].includes(remetente.admin)) {
            await sock.sendMessage(grupo, {
                text: "🔗 Convite de grupo detectado. Administradores estão isentos desta moderação."
            });

            return;
        }

        const leon = localizarParticipante(metadata, [
            sock.user?.id,
            sock.user?.lid
        ]);

        if (!["admin", "superadmin"].includes(leon?.admin)) {
            console.warn(
                "[LEON] Não sou administrador; não posso moderar convites."
            );

            return;
        }

        let mensagemRemovida = false;
        let participanteRemovido = false;

        try {
            await sock.sendMessage(grupo, {
                delete: mensagem.key
            });

            mensagemRemovida = true;
        } catch (erro) {
            console.error("[LEON] Não consegui apagar o convite:", erro);
        }

        try {
            await sock.groupParticipantsUpdate(
                grupo,
                [remetente.id],
                "remove"
            );

            participanteRemovido = true;
        } catch (erro) {
            console.error("[LEON] Não consegui remover o autor:", erro);
        }

        let resposta;

        if (mensagemRemovida && participanteRemovido) {
            resposta = "🚫 Convite de grupo removido e autor expulso.";
        } else if (mensagemRemovida) {
            resposta = "⚠️ Apaguei o convite, mas não consegui remover o autor.";
        } else if (participanteRemovido) {
            resposta = "⚠️ O autor foi removido, mas não consegui apagar a mensagem.";
        } else {
            resposta = "⚠️ Não consegui apagar o convite nem remover o autor. Um administrador precisa verificar.";
        }

        await sock.sendMessage(grupo, {
            text: resposta
        });
    }

    const mensagensBemVindo = [
        "Bem-vindo(a), @usuario! Leia as regras e tente não causar problemas.",
        "@usuario chegou ao grupo. Com a velha hospitalidade de Raccoon City.",
        "Bem-vindo(a), @usuario. Esperamos que sua estadia seja tranquila.",
        "@usuario entrou! Dê uma olhada nas regras antes de começar."
    ];

    sock.ev.on("group-participants.update", async atualizacao => {
        if (
            atualizacao.action !== "add" ||
            !ehGrupo(atualizacao.id) ||
            !bemVindoAtivo(atualizacao.id)
        ) {
            return;
        }

        const participantes = atualizacao.participants ?? [];

        if (participantes.length === 0) {
            return;
        }

        const mencionados = participantes
            .map(participante =>
                typeof participante === "string"
                    ? participante
                    : participante.id
            )
            .filter(Boolean);

        const principal = mencionados[0];

        if (!principal) {
            return;
        }

        const numero = principal.split("@")[0];
        const base = mensagensBemVindo[
            Math.floor(Math.random() * mensagensBemVindo.length)
            ];

        try {
            await sock.sendMessage(atualizacao.id, {
                text: base.replace("@usuario", `@${numero}`),
                mentions: mencionados
            });
        } catch (erro) {
            console.error("[LEON] Erro ao enviar boas-vindas:", erro);
        }
    });

    const mediaHandler = iniciarMediaHandler(sock, leonJava);

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify") {
            return;
        }

        for (const mensagem of messages) {
            try {
                if (!mensagem?.message || mensagem.key?.fromMe) {
                    continue;
                }

                const grupo = mensagem.key.remoteJid;

                if (!grupo) {
                    continue;
                }

                const idMensagem = mensagem.key.id;
                const agora = Date.now();

                for (const [chave, horario] of mensagensProcessadas) {
                    if (agora - horario >= RETENCAO_MENSAGENS) {
                        mensagensProcessadas.delete(chave);
                    }
                }

                if (idMensagem) {
                    const chave = `${grupo}:${idMensagem}`;

                    if (mensagensProcessadas.has(chave)) {
                        continue;
                    }

                    mensagensProcessadas.set(chave, agora);

                    while (mensagensProcessadas.size > LIMITE_MENSAGENS) {
                        const maisAntiga = mensagensProcessadas.keys().next().value;
                        mensagensProcessadas.delete(maisAntiga);
                    }
                }

                const conteudoOriginal = mensagem.message;
                const conteudo = obterConteudo(mensagem);
                const texto = obterTexto(conteudo);
                const contexto = obterContexto(conteudo);
                const mencionados = contexto?.mentionedJid ?? [];

                // Não processa mensagens de visualização única.
                const visualizacaoUnica = Boolean(
                    conteudoOriginal.viewOnceMessage ||
                    conteudoOriginal.viewOnceMessageV2 ||
                    conteudoOriginal.viewOnceMessageV2Extension ||
                    conteudoOriginal.imageMessage?.viewOnce ||
                    conteudoOriginal.videoMessage?.viewOnce
                );

                if (visualizacaoUnica) {
                    continue;
                }

                const comandoAntiLink = texto.match(
                    /^\/antilinkgp(?:\s+(on|off))?$/i
                );

                if (comandoAntiLink) {
                    await processarAntiLinkComando(
                        mensagem,
                        comandoAntiLink[1]?.toLowerCase()
                    );

                    continue;
                }

                const textoParaVerificar = [
                    texto,
                    conteudo.imageMessage?.caption,
                    conteudo.videoMessage?.caption,
                    conteudo.documentMessage?.caption
                ].filter(Boolean).join("\n");

                // Detecta somente convites de grupos do WhatsApp.
                const contemConvite = /(?:https?:\/\/)?(?:www\.)?chat\.whatsapp\.com\/[A-Za-z0-9_-]+/i
                    .test(textoParaVerificar);

                if (
                    ehGrupo(grupo) &&
                    gruposAntiLink[grupo] === true &&
                    contemConvite
                ) {
                    await moderarConvite(mensagem, grupo);
                    continue;
                }

                const remetente = localizarParticipante(
                    { participants: [] },
                    obterIdentificadoresRemetente(mensagem)
                );

                // Registra mídia recebida para os comandos de conversão.
                const sticker = conteudo.stickerMessage;
                const imagem = conteudo.imageMessage;
                const video = conteudo.videoMessage;

                if (sticker) {
                    await mediaHandler.processarSticker(mensagem, sticker);
                    continue;
                }

                if (imagem) {
                    await mediaHandler.processarImagem(mensagem, imagem);
                    continue;
                }

                if (video) {
                    await mediaHandler.processarVideo(mensagem, video);
                    continue;
                }

                if (!texto) {
                    continue;
                }

                if (texto === "/menuadm") {
                    await processarMenuAdm(mensagem);
                    continue;
                }

                if (texto === "/ban" || texto.startsWith("/ban ")) {
                    await processarBan(mensagem, contexto);
                    continue;
                }

                if (texto === "/regras") {
                    await processarRegras(mensagem);
                    continue;
                }

                if (texto === "/bemvindo" || texto.startsWith("/bemvindo ")) {
                    await processarBemVindo(mensagem, texto);
                    continue;
                }

                if (texto === "/s") {
                    const processado =
                        await mediaHandler.processarStickerRespondido(mensagem);

                    if (!processado) {
                        await sock.sendMessage(grupo, {
                            text: "🖼️ Responda a uma imagem ou vídeo com `/s`."
                        });
                    }

                    continue;
                }

                if (texto === "/toimg") {
                    const processado =
                        await mediaHandler.processarToImgRespondido(mensagem);

                    if (!processado) {
                        await sock.sendMessage(grupo, {
                            text: "🖼️ Responda a uma figurinha com `/toimg`."
                        });
                    }

                    continue;
                }

                if (texto === "/togif") {
                    const processado =
                        await mediaHandler.processarToGifRespondido(mensagem);

                    if (!processado) {
                        await sock.sendMessage(grupo, {
                            text: "🎞️ Responda a uma figurinha animada com `/togif`."
                        });
                    }

                    continue;
                }

                // Comandos restantes, como /menu e /info, são tratados pelo Java.
                if (texto.startsWith("/")) {
                    enviarParaJava(grupo, texto, mensagem, mencionados);
                    continue;
                }

                // Mensagens comuns usam o protocolo contextual do Leon.
                const codificado = Buffer
                    .from(texto, "utf8")
                    .toString("base64");

                enviarParaJava(
                    grupo,
                    `__LEON_CONTEXTUAL__:${codificado}`,
                    mensagem,
                    mencionados
                );
            } catch (erro) {
                console.error("[LEON] Erro ao processar mensagem:", erro);
            }
        }
    });
}

module.exports = {
    iniciarMessageHandler
};