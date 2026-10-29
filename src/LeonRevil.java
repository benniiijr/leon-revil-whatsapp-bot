import java.io.File;
import java.util.Scanner;

public class LeonRevil {

    private final MediaService mediaService;
    private final LeonPersonality personalidade;

    public LeonRevil() {
        mediaService = new MediaService();
        personalidade = new LeonPersonality();
    }

    public LeonPersonality getPersonalidade() {
        return personalidade;
    }

    // Permite testar os comandos diretamente pelo terminal.
    public void ligar() {
        System.out.println("Leon Revil está pronto. ⚡");

        try (Scanner sc = new Scanner(System.in)) {
            while (sc.hasNextLine()) {
                String entrada = sc.nextLine();
                String resposta = processarComando(entrada);

                if (resposta != null) {
                    System.out.println(resposta);
                }
            }
        }
    }

    // Interpreta somente os comandos definidos para o Leon.
    public String processarComando(String entrada) {

        if (entrada == null || entrada.isBlank()) {
            return null;
        }

        String[] partes = entrada.trim().split("\\s+");
        String comando = partes[0].toLowerCase();

        switch (comando) {

            case "/menu":
                return exibirComandos();

            case "/info":
                return exibirInformacoes();

            case "/s":
                return "Manda uma imagem ou vídeo junto com o comando. 🎭";

            case "/toimg":
                return personalidade.respostaImagem("você");

            case "/togif":
                return personalidade.respostaGif("você");

            case "/ban":
            case "__LEON_BAN_SUCCESS__":
                return comando.equals("__LEON_BAN_SUCCESS__")
                        ? personalidade.respostaBan()
                        : "__LEON_BAN__";

            case "__LEON_BAN_ERROR_NOT_GROUP__":
                return personalidade.respostaErroBanNaoGrupo();

            case "__LEON_BAN_ERROR_MULTIPLE__":
                return personalidade.respostaErroBanMultiplos();

            case "__LEON_BAN_ERROR_NO_TARGET__":
                return personalidade.respostaErroBanSemAlvo();

            case "__LEON_BAN_ERROR_EXECUTOR_NOT_ADMIN__":
                return personalidade.respostaErroBanExecutorNaoAdmin();

            case "__LEON_BAN_ERROR_LEON_NOT_ADMIN__":
                return personalidade.respostaErroBanLeonNaoAdmin();

            case "__LEON_BAN_ERROR_TARGET_NOT_FOUND__":
                return personalidade.respostaErroBanAlvoInexistente();

            case "__LEON_BAN_ERROR_TARGET_ADMIN__":
                return personalidade.respostaErroBanAlvoAdmin();

            case "__LEON_BAN_ERROR_LEON_TARGET__":
                return personalidade.respostaErroBanLeonAlvo();

            case "__LEON_BAN_ERROR__":
                return personalidade.respostaErroBan();

            case "/regras":
                return "__LEON_REGRAS__";

            case "/bemvindo":
                return processarConfiguracao(
                        partes,
                        "__LEON_BEMVINDO__"
                );

            case "/antilinkgp":
                return processarConfiguracao(
                        partes,
                        "__LEON_ANTILINKGP__"
                );

            default:
                return null;
        }
    }

    // Encaminha configurações para o Node.js validar e aplicar no grupo.
    private String processarConfiguracao(
            String[] partes,
            String identificador
    ) {

        if (partes.length != 2) {
            return "Use: on ou off. Exemplo: /"
                    + identificador
                    .replace("__LEON_", "")
                    .replace("__", "")
                    .toLowerCase()
                    + " on";
        }

        String valor = partes[1].toLowerCase();

        if (!valor.equals("on") && !valor.equals("off")) {
            return "Opção inválida. Use on ou off.";
        }

        return identificador + " " + valor;
    }

    // Converte imagem em figurinha.
    public String converterImagemSelecionada(
            String caminhoImagem,
            String solicitante
    ) {

        String sticker = mediaService.prepararImagemParaSticker(
                caminhoImagem,
                solicitante
        );

        if (sticker.startsWith("__LEON_STICKER__ ")) {
            return "__LEON_STICKER_TEXT__ "
                    + personalidade.respostaSticker(solicitante)
                    + "\n"
                    + sticker;
        }

        return sticker;
    }

    // Valida e converte vídeo em figurinha.
    public String converterVideoSelecionado(
            String caminhoVideo,
            String solicitante
    ) {

        File video = new File(caminhoVideo);

        if (!video.exists()) {
            return "Não encontrei o arquivo de vídeo. 🤨";
        }

        try {
            double duracao =
                    mediaService.obterDuracaoVideo(caminhoVideo);

            if (duracao > 20.0) {
                mediaService.apagarArquivo(caminhoVideo);
                return "O vídeo ultrapassa o limite de 20 segundos. ⏱️";
            }

            String sticker = mediaService.converterVideoEmSticker(
                    caminhoVideo,
                    solicitante
            );

            if (sticker.startsWith("__LEON_STICKER__ ")) {
                return "__LEON_STICKER_TEXT__ "
                        + personalidade.respostaSticker(solicitante)
                        + "\n"
                        + sticker;
            }

            return sticker;

        } catch (Exception erro) {
            System.err.println(
                    "[LEON] Erro ao converter vídeo: "
                            + erro.getMessage()
            );

            return "Não consegui converter esse vídeo. 🤨";
        }
    }

    // Converte figurinha em imagem.
    public String converterStickerEmImagem(String caminhoSticker) {
        return mediaService.converterStickerEmImagem(caminhoSticker);
    }

    // Converte figurinha animada para vídeo em loop.
    public String converterStickerEmGif(String caminhoSticker) {
        return mediaService.converterStickerEmGif(caminhoSticker);
    }

    public String exibirComandos() {
        return """
                ⚡ *LEON REVIL*

                ╭ 🎭 *MÍDIA*
                │
                │ 🖼️ `/s` → Imagem/vídeo em figurinha
                │ 🖼️ `/toimg` → Figurinha em imagem
                │ 🎞️ `/togif` → Figurinha animada em vídeo
                ╰────────────

                ╭ 👑 *ADMINISTRAÇÃO*
                │
                │ 🔨 `/ban` → Remove participante
                │ 📜 `/regras` → Mostra as regras
                │ 👋 `/bemvindo on/off`
                │ 🔗 `/antilinkgp on/off`
                ╰────────────

                ╭ ⚡ *LEON*
                │
                │ ℹ️ `/info` → Informações do bot
                │ 📖 `/menu` → Exibe este menu
                ╰────────────
                """;
    }

    private String obterVersao() {
        File arquivo = new File("../../version.txt");

        try (Scanner leitor = new Scanner(arquivo)) {
            return leitor.nextLine();
        } catch (Exception erro) {
            return "desconhecida";
        }
    }

    public String exibirInformacoes() {
        return "*Leon Revil v" + obterVersao() + "* ⚡\n\n"
                + "*Status:* Online 🟢\n"
                + "*Funções:* conversão de mídia e administração de grupos.\n"
                + "*Comandos:* /menu e /menuadm.\n";
    }
}