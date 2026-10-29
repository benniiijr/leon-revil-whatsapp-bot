import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;

public class MediaService {

    private static final long LIMITE_STICKER_ANIMADO = 500 * 1024;
    private static final double DURACAO_MAXIMA_VIDEO = 20.0;
    private static final double DURACAO_STICKER = 10.0;

    // =========================================================
    // IMAGEM -> FIGURINHA WEBP
    // =========================================================

    public String prepararImagemParaSticker(
            String caminhoImagem,
            String solicitante
    ) {
        File imagem = new File(caminhoImagem);

        if (!imagem.isFile()) {
            System.err.println("[MEDIA] Imagem não encontrada: " + caminhoImagem);
            return "Essa imagem resolveu sumir. Ótimo.";
        }

        String saida = gerarCaminhoSaida(caminhoImagem, "-sticker.webp");

        try {
            int codigo = executar(
                    "magick",
                    caminhoImagem,
                    "-auto-orient",
                    "-resize", "512x512",
                    "-background", "none",
                    "-gravity", "center",
                    "-extent", "512x512",
                    saida
            );

            if (codigo != 0 || !arquivoValido(saida)) {
                apagarArquivo(saida);
                return "Essa imagem não quis virar figurinha. Fazer o quê.";
            }

            System.err.println("[MEDIA] Figurinha criada: " + saida);
            return "__LEON_STICKER__ " + saida;

        } catch (Exception erro) {
            registrarErro("Erro ao converter imagem para figurinha", erro);
            apagarArquivo(saida);
            return "Essa imagem resolveu me dar trabalho. Que novidade.";
        }
    }

    // =========================================================
    // VÍDEO -> FIGURINHA ANIMADA WEBP
    // =========================================================

    public String converterVideoEmSticker(
            String caminhoVideo,
            String solicitante
    ) {
        File video = new File(caminhoVideo);

        if (!video.isFile()) {
            System.err.println("[MEDIA] Vídeo não encontrado: " + caminhoVideo);
            return "Esse vídeo resolveu sumir antes de eu terminar. 🤨";
        }

        String caminhoProcessamento = caminhoVideo;

        try {
            double duracao = obterDuracaoVideo(caminhoVideo);

            System.err.println("[MEDIA] Duração do vídeo: " + duracao + " segundos");

            if (duracao <= 0 || duracao > DURACAO_MAXIMA_VIDEO) {
                apagarArquivo(caminhoVideo);
                return "Passou de vinte segundos. Eu não pedi um filme.";
            }

            String baseVideo = gerarCaminhoSaida(caminhoVideo, "");

            if (duracao > DURACAO_STICKER) {
                caminhoProcessamento = baseVideo + "-10s.mp4";

                int codigoCorte = executar(
                        "ffmpeg",
                        "-y",
                        "-i", caminhoVideo,
                        "-t", String.valueOf((int) DURACAO_STICKER),
                        "-c:v", "libx264",
                        "-preset", "ultrafast",
                        "-an",
                        caminhoProcessamento
                );

                if (codigoCorte != 0 || !arquivoValido(caminhoProcessamento)) {
                    apagarArquivo(caminhoProcessamento);
                    apagarArquivo(caminhoVideo);
                    return "Esse vídeo não quis colaborar com o corte.";
                }
            }

            String baseProcessamento = gerarCaminhoSaida(
                    caminhoProcessamento,
                    ""
            );

            // Duas tentativas para respeitar o limite de 500 KB.
            String[][] configuracoes = {
                    {"1", "30", "384", "55"},
                    {"2", "7", "384", "30"}
            };

            for (String[] config : configuracoes) {
                String tentativa = config[0];
                String fps = config[1];
                String resolucao = config[2];
                String qualidade = config[3];

                String saida = baseProcessamento
                        + "-sticker-" + tentativa + ".webp";

                int codigo = executar(
                        "ffmpeg",
                        "-y",
                        "-i", caminhoProcessamento,
                        "-vf", "fps=" + fps + ",scale="
                                + resolucao + ":" + resolucao
                                + ":force_original_aspect_ratio=decrease,"
                                + "pad=" + resolucao + ":" + resolucao
                                + ":(ow-iw)/2:(oh-ih)/2:color=0x00000000",
                        "-loop", "0",
                        "-c:v", "libwebp",
                        "-q:v", qualidade,
                        "-compression_level", "6",
                        "-an",
                        saida
                );

                if (codigo != 0 || !arquivoValido(saida)) {
                    apagarArquivo(saida);
                    continue;
                }

                File sticker = new File(saida);

                System.err.println(
                        "[MEDIA] Tentativa " + tentativa
                                + ": " + sticker.length() + " bytes"
                );

                if (sticker.length() <= LIMITE_STICKER_ANIMADO) {
                    apagarArquivo(caminhoProcessamento);

                    if (!caminhoProcessamento.equals(caminhoVideo)) {
                        apagarArquivo(caminhoVideo);
                    }

                    return "__LEON_STICKER__ " + saida;
                }

                apagarArquivo(saida);
            }

            apagarArquivo(caminhoProcessamento);

            if (!caminhoProcessamento.equals(caminhoVideo)) {
                apagarArquivo(caminhoVideo);
            }

            return "Essa figurinha ficou pesada demais. Me manda um vídeo mais simples.";

        } catch (Exception erro) {
            registrarErro("Erro ao converter vídeo para figurinha", erro);

            apagarArquivo(caminhoProcessamento);

            if (!caminhoProcessamento.equals(caminhoVideo)) {
                apagarArquivo(caminhoVideo);
            }

            return "Esse vídeo conseguiu acabar com a minha paciência.";
        }
    }

    // =========================================================
    // FIGURINHA WEBP -> IMAGEM PNG
    // =========================================================

    public String converterStickerEmImagem(String caminhoSticker) {
        File sticker = new File(caminhoSticker);

        if (!sticker.isFile()) {
            return "Essa figurinha resolveu sumir. 🤨";
        }

        String saida = gerarCaminhoSaida(caminhoSticker, "-imagem.png");

        try {
            int codigo = executar(
                    "magick",
                    caminhoSticker,
                    "-coalesce",
                    "-delete", "1--1",
                    saida
            );

            if (codigo != 0 || !arquivoValido(saida)) {
                apagarArquivo(saida);
                return "Essa figurinha não quis voltar para a imagem.";
            }

            return "__LEON_IMAGE_RESPONSE__ " + saida;

        } catch (Exception erro) {
            registrarErro("Erro ao converter figurinha em imagem", erro);
            apagarArquivo(saida);
            return "Essa figurinha resolveu me dar trabalho. ";
        }
    }

    // =========================================================
    // FIGURINHA ANIMADA WEBP -> MP4 PARA O WHATSAPP
    // =========================================================

    public String converterStickerEmGif(String caminhoSticker) {
        File sticker = new File(caminhoSticker);

        if (!sticker.isFile()) {
            return "Essa figurinha resolveu sumir. 🤨";
        }

        String base = gerarCaminhoSaida(caminhoSticker, "");
        String gifIntermediario = base + "-timing.gif";
        String mp4 = base + "-gif.mp4";

        try {
            // O GIF intermediário preserva os tempos dos quadros
            // da animação antes da conversão para vídeo.
            int codigoMagick = executar(
                    "magick",
                    caminhoSticker,
                    "-coalesce",
                    gifIntermediario
            );

            if (codigoMagick != 0 || !arquivoValido(gifIntermediario)) {
                apagarArquivo(gifIntermediario);
                return "A animação não quis colaborar.";
            }

            int codigoFfmpeg = executar(
                    "ffmpeg",
                    "-y",
                    "-i", gifIntermediario,
                    "-an",
                    "-c:v", "libx264",
                    "-preset", "ultrafast",
                    "-crf", "30",
                    "-pix_fmt", "yuv420p",
                    "-movflags", "faststart",
                    mp4
            );

            apagarArquivo(gifIntermediario);

            if (codigoFfmpeg != 0 || !arquivoValido(mp4)) {
                apagarArquivo(mp4);
                return "O GIF não quis terminar de se transformar.";
            }

            // O WhatsApp recebe um vídeo MP4, não um arquivo GIF.
            apagarArquivo(caminhoSticker);

            return "__LEON_GIF_RESPONSE__ " + mp4;

        } catch (Exception erro) {
            registrarErro("Erro ao converter figurinha animada", erro);
            apagarArquivo(gifIntermediario);
            apagarArquivo(mp4);
            return "Essa conversão resolveu me dar trabalho.";
        }
    }

    // =========================================================
    // UTILITÁRIOS
    // =========================================================

    public double obterDuracaoVideo(String caminhoVideo) throws Exception {
        Process processo = new ProcessBuilder(
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                caminhoVideo
        )
                .redirectErrorStream(true)
                .start();

        String resultado;

        try (BufferedReader leitor = new BufferedReader(
                new InputStreamReader(processo.getInputStream()))) {
            resultado = leitor.readLine();
        }

        int codigo = processo.waitFor();

        if (codigo != 0 || resultado == null) {
            throw new RuntimeException(
                    "Não foi possível obter a duração do vídeo."
            );
        }

        double duracao = Double.parseDouble(resultado.trim());

        if (!Double.isFinite(duracao)) {
            throw new RuntimeException("Duração de vídeo inválida.");
        }

        return duracao;
    }

    public boolean apagarArquivo(String caminho) {
        if (caminho == null) {
            return false;
        }

        File arquivo = new File(caminho);

        if (!arquivo.exists()) {
            return false;
        }

        boolean apagado = arquivo.delete();

        if (apagado) {
            System.err.println("[MEDIA] Arquivo temporário removido: " + caminho);
        } else {
            System.err.println("[MEDIA] Não foi possível remover: " + caminho);
        }

        return apagado;
    }

    private int executar(String... comando) throws Exception {
        System.err.println("[MEDIA] Executando: " + String.join(" ", comando));

        Process processo = new ProcessBuilder(comando)
                .redirectErrorStream(true)
                .start();

        try (BufferedReader leitor = new BufferedReader(
                new InputStreamReader(processo.getInputStream()))) {
            String linha;

            while ((linha = leitor.readLine()) != null) {
                System.err.println("[MEDIA] " + linha);
            }
        }

        return processo.waitFor();
    }

    private boolean arquivoValido(String caminho) {
        File arquivo = new File(caminho);
        return arquivo.isFile() && arquivo.length() > 0;
    }

    private String gerarCaminhoSaida(String caminho, String sufixo) {
        int separador = Math.max(
                caminho.lastIndexOf('/'),
                caminho.lastIndexOf('\\')
        );

        int ponto = caminho.lastIndexOf('.');

        if (ponto <= separador) {
            return caminho + sufixo;
        }

        return caminho.substring(0, ponto) + sufixo;
    }

    private void registrarErro(String mensagem, Exception erro) {
        System.err.println("[MEDIA] " + mensagem + ": " + erro.getMessage());
    }
}