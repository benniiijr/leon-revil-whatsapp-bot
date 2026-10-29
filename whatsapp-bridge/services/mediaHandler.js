const media = require("./media");

function iniciarMediaHandler(sock, leonJava) {

    // Obtém o nome de quem enviou a mensagem.
    function obterNomeSolicitante(mensagem) {
        return (
            mensagem.pushName ??
            mensagem.key.pushName ??
            "Desconhecido"
        );
    }

    // Obtém o identificador de quem enviou a mensagem.
    function obterJidSolicitante(mensagem) {
        return (
            mensagem.key.participant ??
            mensagem.key.remoteJidAlt ??
            mensagem.key.remoteJid
        );
    }

    // Encaminha uma solicitação ao processo Java.
    function enviarParaJava(mensagem, comando, mencoes = []) {
        leonJava.definirDestinatario(
            mensagem.key.remoteJid,
            mencoes,
            mensagem
        );

        leonJava.stdin.write(`${comando}\n`);
    }

    // Processa imagens recebidas com a legenda /s.
    async function processarImagem(mensagem, imagem) {
        const legenda = imagem.caption ?? "";
        const solicitante = obterNomeSolicitante(mensagem);
        const jidSolicitante = obterJidSolicitante(mensagem);

        console.log("[LEON-MEDIA] Imagem recebida.");
        console.log("[LEON-MEDIA] Solicitante:", solicitante);

        if (legenda.trim() !== "/s") {
            return;
        }

        const caminhoImagem = await media.baixarImagem(
            sock,
            mensagem
        );

        if (!caminhoImagem) {
            console.error("[LEON-MEDIA] Não foi possível baixar a imagem.");
            return;
        }

        console.log("[LEON-MEDIA] Convertendo imagem em figurinha.");

        // O caminho é separado por tabulação para não quebrar
        // quando o nome do arquivo ou do solicitante contém espaços.
        enviarParaJava(
            mensagem,
            `__LEON_STICKER_REQUEST__ imagem\t${caminhoImagem}\t${solicitante}`,
            [jidSolicitante]
        );
    }

    // Processa vídeos recebidos com a legenda /s.
    async function processarVideo(mensagem, video) {
        const legenda = video.caption ?? "";
        const solicitante = obterNomeSolicitante(mensagem);
        const jidSolicitante = obterJidSolicitante(mensagem);

        console.log("[LEON-MEDIA] Vídeo recebido.");
        console.log("[LEON-MEDIA] Solicitante:", solicitante);

        if (legenda.trim() !== "/s") {
            return;
        }

        const caminhoVideo = await media.baixarVideo(
            sock,
            mensagem
        );

        if (!caminhoVideo) {
            console.error("[LEON-MEDIA] Não foi possível baixar o vídeo.");
            return;
        }

        console.log("[LEON-MEDIA] Convertendo vídeo em figurinha.");

        enviarParaJava(
            mensagem,
            `__LEON_STICKER_REQUEST__ video\t${caminhoVideo}\t${solicitante}`,
            [jidSolicitante]
        );
    }

    // Registra o recebimento de figurinhas.
    async function processarSticker(mensagem, sticker) {
        console.log("[LEON-MEDIA] Figurinha recebida.");
        console.log(
            "[LEON-MEDIA] Solicitante:",
            obterNomeSolicitante(mensagem)
        );
    }

    // Converte a mídia citada em figurinha com /s.
    async function processarStickerRespondido(mensagem) {
        console.log("[LEON-MEDIA] Comando /s respondendo à mídia.");

        const midia = await media.baixarMidiaRespondida(
            sock,
            mensagem
        );

        if (midia?.visualizacaoUnica) {
            enviarParaJava(mensagem, "__LEON_VIEW_ONCE__");
            return true;
        }

        if (!midia) {
            console.log("[LEON-MEDIA] Não foi possível recuperar a mídia.");
            return false;
        }

        if (!["imagem", "video"].includes(midia.tipo)) {
            console.log("[LEON-MEDIA] Tipo de mídia não suportado para /s.");
            return false;
        }

        const solicitante = obterNomeSolicitante(mensagem);
        const jidSolicitante = obterJidSolicitante(mensagem);

        console.log("[LEON-MEDIA] Tipo:", midia.tipo);
        console.log("[LEON-MEDIA] Arquivo:", midia.caminho);

        enviarParaJava(
            mensagem,
            `__LEON_STICKER_REQUEST__ ${midia.tipo}\t${midia.caminho}\t${solicitante}`,
            [jidSolicitante]
        );

        return true;
    }

    // Converte uma figurinha citada em imagem.
    async function processarToImgRespondido(mensagem) {
        console.log("[LEON-MEDIA] Comando /toimg.");

        const midia = await media.baixarMidiaRespondida(
            sock,
            mensagem
        );

        if (midia?.visualizacaoUnica) {
            enviarParaJava(mensagem, "__LEON_VIEW_ONCE__");
            return true;
        }

        if (!midia) {
            console.log("[LEON-MEDIA] Não foi possível recuperar a mídia.");
            return false;
        }

        if (midia.tipo !== "sticker") {
            console.log("[LEON-MEDIA] Responda a uma figurinha para usar /toimg.");
            return false;
        }

        const solicitante = obterNomeSolicitante(mensagem);
        const jidSolicitante = obterJidSolicitante(mensagem);

        enviarParaJava(
            mensagem,
            `__LEON_TOIMG__ ${midia.caminho}\t${solicitante}`,
            [jidSolicitante]
        );

        return true;
    }

    // Converte uma figurinha animada citada em vídeo.
    async function processarToGifRespondido(mensagem) {
        console.log("[LEON-MEDIA] Comando /togif.");

        const midia = await media.baixarMidiaRespondida(
            sock,
            mensagem
        );

        if (midia?.visualizacaoUnica) {
            enviarParaJava(mensagem, "__LEON_VIEW_ONCE__");
            return true;
        }

        if (!midia) {
            console.log("[LEON-MEDIA] Não foi possível recuperar a mídia.");
            return false;
        }

        if (midia.tipo !== "sticker") {
            console.log("[LEON-MEDIA] Responda a uma figurinha para usar /togif.");
            return false;
        }

        const solicitante = obterNomeSolicitante(mensagem);
        const jidSolicitante = obterJidSolicitante(mensagem);

        enviarParaJava(
            mensagem,
            `__LEON_TOGIF__ ${midia.caminho}\t${solicitante}`,
            [jidSolicitante]
        );

        return true;
    }

    return {
        processarImagem,
        processarVideo,
        processarSticker,
        processarStickerRespondido,
        processarToImgRespondido,
        processarToGifRespondido
    };
}

module.exports = {
    iniciarMediaHandler
};