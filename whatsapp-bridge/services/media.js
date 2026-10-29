const fs = require("fs");
const path = require("path");

const {
    downloadMediaMessage
} = require("@whiskeysockets/baileys");

// Pasta temporária compartilhada pelos serviços de mídia.
function criarPastaTemp() {
    const pastaTemp = path.resolve(__dirname, "../../temp");

    fs.mkdirSync(pastaTemp, {
        recursive: true
    });

    return pastaTemp;
}

// Cria um nome temporário exclusivo para cada arquivo.
function criarCaminhoTemp(prefixo, extensao) {
    const identificador =
        `${Date.now()}-${process.pid}-${Math.random()
            .toString(16)
            .slice(2)}`;

    return path.join(
        criarPastaTemp(),
        `${prefixo}-${identificador}${extensao}`
    );
}

// Baixa a mídia de uma mensagem e devolve um Buffer.
async function baixarBuffer(sock, mensagem) {
    return downloadMediaMessage(
        mensagem,
        "buffer",
        {},
        {
            reuploadRequest: sock.updateMediaMessage
        }
    );
}

// Salva uma mídia recebida em um arquivo temporário.
async function baixarMidia(sock, mensagem, tipo) {
    let caminhoArquivo;

    try {
        const configuracoes = {
            imagem: {
                prefixo: "leon-imagem",
                extensao: ".jpg"
            },
            video: {
                prefixo: "leon-video",
                extensao: ".mp4"
            },
            sticker: {
                prefixo: "leon-sticker",
                extensao: ".webp"
            }
        };

        const configuracao = configuracoes[tipo];

        if (!configuracao) {
            throw new Error(`Tipo de mídia não suportado: ${tipo}`);
        }

        caminhoArquivo = criarCaminhoTemp(
            configuracao.prefixo,
            configuracao.extensao
        );

        console.log(`[LEON-MEDIA] Baixando ${tipo}...`);

        const buffer = await baixarBuffer(sock, mensagem);

        if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
            throw new Error("O WhatsApp retornou uma mídia vazia.");
        }

        fs.writeFileSync(caminhoArquivo, buffer);

        console.log(`[LEON-MEDIA] Arquivo salvo: ${caminhoArquivo}`);

        return caminhoArquivo;

    } catch (erro) {
        if (caminhoArquivo && fs.existsSync(caminhoArquivo)) {
            fs.unlinkSync(caminhoArquivo);
        }

        console.error(
            `[LEON-MEDIA] Erro ao baixar ${tipo}:`,
            erro.message
        );

        return null;
    }
}

async function baixarImagem(sock, mensagem) {
    return baixarMidia(sock, mensagem, "imagem");
}

async function baixarVideo(sock, mensagem) {
    return baixarMidia(sock, mensagem, "video");
}

async function baixarSticker(sock, mensagem) {
    return baixarMidia(sock, mensagem, "sticker");
}

// Desembrulha os formatos de mensagem usados pelo WhatsApp.
function desembrulharMensagem(mensagem) {
    let atual = mensagem;

    while (atual) {
        if (atual.ephemeralMessage?.message) {
            atual = atual.ephemeralMessage.message;
            continue;
        }

        if (atual.documentWithCaptionMessage?.message) {
            atual = atual.documentWithCaptionMessage.message;
            continue;
        }

        if (atual.viewOnceMessage?.message) {
            return {
                mensagem: atual.viewOnceMessage.message,
                visualizacaoUnica: true
            };
        }

        if (atual.viewOnceMessageV2?.message) {
            return {
                mensagem: atual.viewOnceMessageV2.message,
                visualizacaoUnica: true
            };
        }

        if (atual.viewOnceMessageV2Extension?.message) {
            return {
                mensagem: atual.viewOnceMessageV2Extension.message,
                visualizacaoUnica: true
            };
        }

        return {
            mensagem: atual,
            visualizacaoUnica: Boolean(
                atual.imageMessage?.viewOnce ||
                atual.videoMessage?.viewOnce
            )
        };
    }

    return {
        mensagem: null,
        visualizacaoUnica: false
    };
}

// Recupera e baixa a mídia de uma mensagem citada.
async function baixarMidiaRespondida(sock, mensagem) {
    let caminhoArquivo;

    try {
        const contexto =
            mensagem.message
                ?.extendedTextMessage
                ?.contextInfo;

        if (!contexto?.quotedMessage || !contexto.stanzaId) {
            console.log(
                "[LEON-MEDIA] Nenhuma mensagem citada foi encontrada."
            );

            return null;
        }

        const resultado = desembrulharMensagem(
            contexto.quotedMessage
        );

        if (resultado.visualizacaoUnica) {
            console.log(
                "[LEON-MEDIA] Mídia de visualização única não suportada."
            );

            return {
                visualizacaoUnica: true
            };
        }

        const mensagemCitacao = resultado.mensagem;

        if (!mensagemCitacao) {
            return null;
        }

        let tipo;
        let extensao;

        if (mensagemCitacao.imageMessage) {
            tipo = "imagem";
            extensao = ".jpg";

        } else if (mensagemCitacao.videoMessage) {
            tipo = "video";
            extensao = ".mp4";

        } else if (mensagemCitacao.stickerMessage) {
            tipo = "sticker";
            extensao = ".webp";

        } else {
            console.log(
                "[LEON-MEDIA] A mensagem citada não contém mídia compatível."
            );

            return null;
        }

        // Em grupos, participante identifica quem enviou a mensagem citada.
        // Em conversas privadas, a ausência de participant não significa
        // automaticamente que a mensagem foi enviada pelo próprio BOT.
        const jidAtual = mensagem.key.remoteJid;
        const participante = contexto.participant;

        const chaveMensagem = {
            remoteJid: jidAtual,
            id: contexto.stanzaId,
            fromMe: Boolean(
                participante &&
                sock.user?.id &&
                participante === sock.user.id
            )
        };

        if (participante) {
            chaveMensagem.participant = participante;
        }

        const mensagemCompleta = {
            key: chaveMensagem,
            message: mensagemCitacao
        };

        console.log(
            `[LEON-MEDIA] Baixando mídia citada: ${tipo}`
        );

        const buffer = await baixarBuffer(
            sock,
            mensagemCompleta
        );

        if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
            throw new Error("A mídia citada está vazia.");
        }

        caminhoArquivo = criarCaminhoTemp(
            "leon-respondida",
            extensao
        );

        fs.writeFileSync(caminhoArquivo, buffer);

        console.log(
            `[LEON-MEDIA] Mídia salva: ${caminhoArquivo}`
        );

        return {
            tipo,
            caminho: caminhoArquivo
        };

    } catch (erro) {
        if (caminhoArquivo && fs.existsSync(caminhoArquivo)) {
            fs.unlinkSync(caminhoArquivo);
        }

        console.error(
            "[LEON-MEDIA] Erro ao recuperar mídia citada:",
            erro.message
        );

        return null;
    }
}

module.exports = {
    baixarImagem,
    baixarVideo,
    baixarSticker,
    baixarMidiaRespondida
};