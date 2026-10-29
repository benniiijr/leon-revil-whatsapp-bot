const fs = require("fs");
const path = require("path");

// Arquivo local de atividade do Leon.
const arquivo = path.join(__dirname, "activity.json");

function carregarDados() {
    try {
        if (!fs.existsSync(arquivo)) {
            return {};
        }

        const conteudo = fs.readFileSync(arquivo, "utf8");
        const dados = JSON.parse(conteudo);

        return dados && typeof dados === "object" && !Array.isArray(dados)
            ? dados
            : {};

    } catch (erro) {
        console.error("[LEON-ACTIVITY] Erro ao carregar dados:", erro.message);
        return {};
    }
}

function salvarDados(dados) {
    try {
        const temporario = `${arquivo}.tmp`;

        fs.writeFileSync(
            temporario,
            JSON.stringify(dados, null, 4),
            "utf8"
        );

        fs.renameSync(temporario, arquivo);

    } catch (erro) {
        console.error("[LEON-ACTIVITY] Erro ao salvar dados:", erro.message);
    }
}

// Registra a última atividade de um participante em um grupo.
function registrarAtividade(grupo, participante) {
    if (
        typeof grupo !== "string" ||
        typeof participante !== "string" ||
        !grupo.endsWith("@g.us") ||
        !participante
    ) {
        return;
    }

    const dados = carregarDados();

    if (
        !dados[grupo] ||
        typeof dados[grupo] !== "object" ||
        Array.isArray(dados[grupo])
    ) {
        dados[grupo] = {};
    }

    dados[grupo][participante] = Date.now();

    salvarDados(dados);
}

// Consulta a atividade registrada para os participantes de um grupo.
function obterAtividades(grupo) {
    if (typeof grupo !== "string" || !grupo.endsWith("@g.us")) {
        return {};
    }

    const dados = carregarDados();
    const atividades = dados[grupo];

    return atividades &&
    typeof atividades === "object" &&
    !Array.isArray(atividades)
        ? atividades
        : {};
}

module.exports = {
    registrarAtividade,
    obterAtividades
};