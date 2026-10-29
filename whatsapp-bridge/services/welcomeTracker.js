const fs = require("fs");
const path = require("path");

// Arquivo que armazena as configurações de boas-vindas.
const arquivo = path.join(__dirname, "welcome.json");

// Carrega as configurações salvas.
function carregarDados() {
    try {
        if (!fs.existsSync(arquivo)) {
            return {};
        }

        const conteudo = fs.readFileSync(
            arquivo,
            "utf8"
        );

        const dados = JSON.parse(conteudo);

        if (
            !dados ||
            typeof dados !== "object" ||
            Array.isArray(dados)
        ) {
            console.error(
                "[LEON-WELCOME] Formato inválido em welcome.json."
            );

            return {};
        }

        return dados;

    } catch (erro) {
        console.error(
            "[LEON-WELCOME] Erro ao carregar configurações:",
            erro.message
        );

        return {};
    }
}

// Salva as configurações usando um arquivo temporário.
function salvarDados(dados) {
    const temporario = `${arquivo}.tmp`;

    try {
        fs.writeFileSync(
            temporario,
            JSON.stringify(dados, null, 4),
            "utf8"
        );

        fs.renameSync(
            temporario,
            arquivo
        );

    } catch (erro) {
        console.error(
            "[LEON-WELCOME] Erro ao salvar configurações:",
            erro.message
        );

        // Remove o temporário incompleto, se existir.
        try {
            if (fs.existsSync(temporario)) {
                fs.unlinkSync(temporario);
            }
        } catch (erroLimpeza) {
            console.error(
                "[LEON-WELCOME] Erro ao limpar temporário:",
                erroLimpeza.message
            );
        }
    }
}

// Ativa ou desativa as boas-vindas de um grupo.
function definirBemVindo(grupo, ativo) {
    if (
        typeof grupo !== "string" ||
        !grupo.endsWith("@g.us")
    ) {
        console.warn(
            "[LEON-WELCOME] Identificador de grupo inválido."
        );

        return false;
    }

    if (typeof ativo !== "boolean") {
        console.warn(
            "[LEON-WELCOME] O estado deve ser true ou false."
        );

        return false;
    }

    const dados = carregarDados();

    dados[grupo] = ativo;

    salvarDados(dados);

    // Confirma que o arquivo contém o estado solicitado.
    const dadosSalvos = carregarDados();

    return dadosSalvos[grupo] === ativo;
}

// Verifica se as boas-vindas estão ativadas no grupo.
function bemVindoAtivo(grupo) {
    if (
        typeof grupo !== "string" ||
        !grupo.endsWith("@g.us")
    ) {
        return false;
    }

    const dados = carregarDados();

    return dados[grupo] === true;
}

module.exports = {
    definirBemVindo,
    bemVindoAtivo
};