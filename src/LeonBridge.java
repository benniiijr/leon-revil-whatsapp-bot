import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class LeonBridge {

    public static void main(String[] args) throws Exception {

        System.setOut(
                new PrintStream(
                        System.out,
                        true,
                        StandardCharsets.UTF_8
                )
        );

        LeonRevil leon = new LeonRevil();

        BufferedReader entrada = new BufferedReader(
                new InputStreamReader(
                        System.in,
                        StandardCharsets.UTF_8
                )
        );

        String mensagem;

        while ((mensagem = entrada.readLine()) != null) {

            if (mensagem.isBlank()) {
                continue;
            }

            try {

                // =============================================
                // RESPOSTA CONTEXTUAL
                // =============================================

                if (mensagem.startsWith("__LEON_CONTEXTUAL__:")) {

                    String codificada = mensagem.substring(
                            "__LEON_CONTEXTUAL__:".length()
                    );

                    String original = new String(
                            Base64.getDecoder().decode(codificada),
                            StandardCharsets.UTF_8
                    );

                    System.out.println(
                            leon.getPersonalidade()
                                    .respostaContextual(original)
                    );

                    finalizarResposta();
                    continue;
                }

                // =============================================
                // CONVERSÃO DE IMAGEM OU VÍDEO EM FIGURINHA
                // Protocolo: tipo<TAB>caminho<TAB>solicitante
                // =============================================

                if (mensagem.startsWith("__LEON_STICKER_REQUEST__ ")) {

                    String dados = mensagem.substring(
                            "__LEON_STICKER_REQUEST__ ".length()
                    );

                    String[] partes = dados.split("\t", 3);

                    if (partes.length != 3
                            || partes[0].isBlank()
                            || partes[1].isBlank()
                            || partes[2].isBlank()) {

                        System.out.println(
                                "Não consegui identificar a mídia enviada. 🤨"
                        );

                        finalizarResposta();
                        continue;
                    }

                    String tipo = partes[0].trim();
                    String caminho = partes[1];
                    String solicitante = partes[2].trim();

                    String resposta;

                    if (tipo.equals("imagem")) {

                        resposta = leon.converterImagemSelecionada(
                                caminho,
                                solicitante
                        );

                    } else if (tipo.equals("video")) {

                        resposta = leon.converterVideoSelecionado(
                                caminho,
                                solicitante
                        );

                    } else {

                        resposta = "Tipo de mídia não reconhecido.";
                    }

                    if (resposta != null && !resposta.isBlank()) {
                        System.out.println(resposta);
                    }

                    finalizarResposta();
                    continue;
                }

                // =============================================
                // CONVERSÃO DE FIGURINHA EM IMAGEM
                // Protocolo: caminho<TAB>solicitante
                // =============================================

                if (mensagem.startsWith("__LEON_TOIMG__ ")) {

                    String dados = mensagem.substring(
                            "__LEON_TOIMG__ ".length()
                    );

                    int separador = dados.lastIndexOf('\t');

                    if (separador < 0) {
                        System.out.println(
                                "Não consegui identificar a figurinha enviada."
                        );

                        finalizarResposta();
                        continue;
                    }

                    String caminho = dados.substring(0, separador);
                    String solicitante = dados.substring(separador + 1).trim();

                    if (caminho.isBlank() || solicitante.isBlank()) {
                        System.out.println(
                                "O caminho da figurinha ou o solicitante está inválido."
                        );

                        finalizarResposta();
                        continue;
                    }

                    String resposta = leon.converterStickerEmImagem(caminho);

                    if (resposta != null && !resposta.isBlank()) {

                        System.out.println(resposta);

                        if (resposta.startsWith("__LEON_IMAGE_RESPONSE__ ")) {

                            System.out.println(
                                    leon.getPersonalidade()
                                            .respostaImagem(solicitante)
                            );
                        }
                    }

                    finalizarResposta();
                    continue;
                }

                // =============================================
                // CONVERSÃO DE FIGURINHA EM VÍDEO
                // Protocolo: caminho<TAB>solicitante
                // =============================================

                if (mensagem.startsWith("__LEON_TOGIF__ ")) {

                    String dados = mensagem.substring(
                            "__LEON_TOGIF__ ".length()
                    );

                    int separador = dados.lastIndexOf('\t');

                    if (separador < 0) {
                        System.out.println(
                                "Não consegui identificar a figurinha enviada."
                        );

                        finalizarResposta();
                        continue;
                    }

                    String caminho = dados.substring(0, separador);
                    String solicitante = dados.substring(separador + 1).trim();

                    if (caminho.isBlank() || solicitante.isBlank()) {
                        System.out.println(
                                "O caminho da figurinha ou o solicitante está inválido."
                        );

                        finalizarResposta();
                        continue;
                    }

                    String resposta = leon.converterStickerEmGif(caminho);

                    if (resposta != null && !resposta.isBlank()) {

                        System.out.println(resposta);

                        if (resposta.startsWith("__LEON_GIF_RESPONSE__ ")) {

                            System.out.println(
                                    leon.getPersonalidade()
                                            .respostaGif(solicitante)
                            );
                        }
                    }

                    finalizarResposta();
                    continue;
                }

                // =============================================
                // COMANDOS GERAIS E ADMINISTRATIVOS
                // =============================================

                String resposta = leon.processarComando(mensagem);

                if (resposta != null && !resposta.isBlank()) {
                    System.out.println(resposta);
                }

                finalizarResposta();

            } catch (Exception erro) {

                System.err.println(
                        "[LEON BRIDGE] Erro ao processar entrada: "
                                + erro.getMessage()
                );

                System.out.println(
                        "Não consegui processar essa solicitação. Tente novamente."
                );

                finalizarResposta();
            }
        }
    }

    private static void finalizarResposta() {
        System.out.println("__LEON_END__");
        System.out.flush();
    }
}