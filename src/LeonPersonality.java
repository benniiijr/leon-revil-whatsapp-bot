import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

public class LeonPersonality {

    private final List<String> respostasContextuais = List.of(
            "Fala. O que aconteceu?",
            "Estou ouvindo. Pode continuar.",
            "Certo. Vamos direto ao ponto.",
            "Diz aí. Como posso ajudar?",
            "Hm? Conta o que houve.",
            "Pode falar. Estou prestando atenção.",
            "Beleza. O que temos para resolver?",
            "Manda. Vamos ver o que dá para fazer."
    );

    private final List<String> respostasSticker = List.of(
            "Pronto, {USUARIO}. Figurinha criada. ⚡",
            "Feito. Agora pode mandar por aí.",
            "Aí está, {USUARIO}. Trabalho concluído.",
            "Conversão finalizada. Simples assim.",
            "Pronto. Mais uma mídia resolvida.",
            "Feito, {USUARIO}. Confere o resultado.",
            "Está pronta. Pode usar.",
            "Conversão concluída. Próxima missão?"
    );

    private final List<String> respostasImagem = List.of(
            "Pronto, {USUARIO}. Aqui está a imagem.",
            "Conversão concluída. Confere aí.",
            "Feito. A figurinha virou imagem. 🖼️",
            "Aí está, {USUARIO}. Tudo certo.",
            "Imagem recuperada com sucesso.",
            "Pronto. Mais uma tarefa concluída.",
            "Feito. Pode conferir o resultado.",
            "Conversão finalizada. Sem complicação."
    );

    private final List<String> respostasGif = List.of(
            "Pronto, {USUARIO}. Vamos colocar isso em movimento. 🎞️",
            "Conversão concluída. Confere o resultado.",
            "Aí está. Movimento pronto para enviar.",
            "Feito, {USUARIO}. Mais uma missão cumprida.",
            "Figurinha animada convertida. ⚡",
            "Pronto. Agora é só conferir.",
            "Conversão finalizada. Pode mandar.",
            "Feito. Espero que tenha ficado como queria."
    );

    private final List<String> respostasBan = List.of(
            "Participante removido do grupo. ⚡",
            "Pronto. A remoção foi concluída.",
            "Ação concluída. Vamos manter a ordem.",
            "Participante removido. Próxima missão?",
            "Feito. O grupo segue em frente."
    );

    private final List<String> errosBanNaoGrupo = List.of(
            "Esse comando só funciona em grupos.",
            "Não há grupo para administrar nesta conversa.",
            "Use esse comando dentro de um grupo."
    );

    private final List<String> errosBanMultiplos = List.of(
            "Escolha apenas um participante por vez.",
            "Um alvo por comando. Vamos com calma.",
            "Marque somente a pessoa que deseja remover."
    );

    private final List<String> errosBanSemAlvo = List.of(
            "Marque alguém ou responda à mensagem do participante.",
            "Preciso saber quem deve ser removido.",
            "Nenhum alvo identificado. Marque um participante."
    );

    private final List<String> errosBanExecutorNaoAdmin = List.of(
            "Você precisa ser administrador para usar esse comando.",
            "Permissão insuficiente. Somente administradores podem fazer isso.",
            "Seu cargo não permite remover participantes."
    );

    private final List<String> errosBanLeonNaoAdmin = List.of(
            "Preciso ser administrador do grupo para remover participantes.",
            "Não tenho permissão para executar essa ação.",
            "Me conceda permissões de administrador e tente novamente."
    );

    private final List<String> errosBanAlvoInexistente = List.of(
            "Esse participante não está mais no grupo.",
            "Não encontrei o participante entre os membros.",
            "O alvo informado não está no grupo."
    );

    private final List<String> errosBanAlvoAdmin = List.of(
            "Não posso remover outro administrador por este comando.",
            "O alvo também é administrador. Verifique as permissões do grupo.",
            "Escolha um participante que não seja administrador."
    );

    private final List<String> errosBanLeonAlvo = List.of(
            "Não posso remover a mim mesmo do grupo.",
            "Esse alvo sou eu. Escolha outro participante.",
            "Não vou executar uma remoção contra mim mesmo."
    );

    private final List<String> errosBan = List.of(
            "Não consegui concluir a remoção. Verifique as permissões.",
            "A remoção falhou. Tente novamente.",
            "Ocorreu um erro durante a ação administrativa."
    );

    private String escolher(List<String> respostas) {
        int indice = ThreadLocalRandom.current()
                .nextInt(respostas.size());

        return respostas.get(indice);
    }

    private String personalizar(
            List<String> respostas,
            String usuario
    ) {
        String nome = usuario == null || usuario.isBlank()
                ? "você"
                : usuario;

        return escolher(respostas)
                .replace("{USUARIO}", nome);
    }

    public String respostaContextual() {
        return escolher(respostasContextuais);
    }

    public String respostaContextual(String mensagem) {
        if (mensagem == null || mensagem.isBlank()) {
            return respostaContextual();
        }

        String texto = mensagem.toLowerCase();

        if (texto.contains("obrigad")
                || texto.contains("valeu")) {
            return escolher(List.of(
                    "Por nada! ⚡",
                    "Tranquilo. Precisando, é só chamar.",
                    "Disponha. Vamos em frente."
            ));
        }

        if (texto.contains("bom dia")
                || texto.contains("boa tarde")
                || texto.contains("boa noite")
                || texto.matches(".*\\b(oi|olá|ola|opa|eai)\\b.*")) {
            return escolher(List.of(
                    "Fala! Tudo certo?",
                    "Olá! Como posso ajudar?",
                    "Opa! Qual é a missão?"
            ));
        }

        if (texto.contains("me ajuda")
                || texto.contains("preciso de ajuda")
                || texto.contains("socorro")) {
            return escolher(List.of(
                    "Pode explicar o que aconteceu?",
                    "Vamos resolver isso. Qual é o problema?",
                    "Certo. Me dá mais detalhes."
            ));
        }

        if (texto.endsWith("?")) {
            return escolher(List.of(
                    "Boa pergunta. Pode dar mais contexto?",
                    "Depende da situação. Explica melhor.",
                    "Vamos analisar isso. O que você já sabe?"
            ));
        }

        return respostaContextual();
    }

    public String respostaSticker(String usuario) {
        return personalizar(respostasSticker, usuario);
    }

    public String respostaImagem(String usuario) {
        return personalizar(respostasImagem, usuario);
    }

    public String respostaGif(String usuario) {
        return personalizar(respostasGif, usuario);
    }

    public String respostaBan() {
        return escolher(respostasBan);
    }

    public String respostaErroBanNaoGrupo() {
        return escolher(errosBanNaoGrupo);
    }

    public String respostaErroBanMultiplos() {
        return escolher(errosBanMultiplos);
    }

    public String respostaErroBanSemAlvo() {
        return escolher(errosBanSemAlvo);
    }

    public String respostaErroBanExecutorNaoAdmin() {
        return escolher(errosBanExecutorNaoAdmin);
    }

    public String respostaErroBanLeonNaoAdmin() {
        return escolher(errosBanLeonNaoAdmin);
    }

    public String respostaErroBanAlvoInexistente() {
        return escolher(errosBanAlvoInexistente);
    }

    public String respostaErroBanAlvoAdmin() {
        return escolher(errosBanAlvoAdmin);
    }

    public String respostaErroBanLeonAlvo() {
        return escolher(errosBanLeonAlvo);
    }

    public String respostaErroBan() {
        return escolher(errosBan);
    }
}