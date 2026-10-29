const makeWASocket =
    require("@whiskeysockets/baileys").default;

const {
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const qrcode =
    require("qrcode-terminal");

const {
    iniciarLeonJava
} = require("./services/leonJava");

const {
    iniciarMessageHandler
} = require("./services/messageHandler");

const path = require("path");
const PASTA_AUTENTICACAO = path.join(__dirname, "auth-leon");

let reconectando = false;

// Inicializa a conexão do Leon Revil com o WhatsApp.
async function iniciarWhatsApp() {
    let leonJava;

    try {
        // Carrega exclusivamente a sessão do Leon.
        const { state, saveCreds } =
            await useMultiFileAuthState(PASTA_AUTENTICACAO);

        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false
        });

        // Inicializa a ponte entre Node.js e Java.
        leonJava = iniciarLeonJava(sock);

        sock.ev.on("creds.update", saveCreds);

        // Registra o processamento das mensagens.
        iniciarMessageHandler(sock, leonJava);

        sock.ev.on("connection.update", async (update) => {
            const {
                connection,
                lastDisconnect,
                qr
            } = update;

            if (qr) {
                console.log("\nQR CODE DO LEON REvil:\n");

                qrcode.generate(qr, {
                    small: true
                });
            }

            if (connection === "open") {
                reconectando = false;

                console.log("\nLeon Revil conectado ao WhatsApp.\n");
            }

            if (connection === "close") {
                const codigo =
                    lastDisconnect?.error?.output?.statusCode;

                console.log("\nConexão do Leon encerrada.");
                console.log("Código:", codigo ?? "desconhecido");

                // Encerra a ponte Java desta conexão.
                try {
                    leonJava?.kill();
                } catch (erro) {
                    console.error(
                        "Erro ao encerrar o processo Java:",
                        erro.message
                    );
                }

                // Não reconecta se a sessão foi desconectada explicitamente.
                if (codigo === DisconnectReason.loggedOut) {
                    console.log(
                        "Sessão desconectada. Será necessário autenticar novamente."
                    );
                    return;
                }

                // Evita iniciar várias reconexões simultaneamente.
                if (reconectando) {
                    return;
                }

                reconectando = true;

                console.log("Tentando reconectar o Leon...");

                setTimeout(() => {
                    iniciarWhatsApp().catch((erro) => {
                        reconectando = false;

                        console.error(
                            "Falha ao reiniciar o Leon:",
                            erro
                        );
                    });
                }, 3000);
            }
        });
    } catch (erro) {
        try {
            leonJava?.kill();
        } catch {}

        reconectando = false;

        console.error(
            "Erro ao inicializar o Leon Revil:",
            erro
        );
    }
}

iniciarWhatsApp().catch((erro) => {
    console.error(
        "Falha ao iniciar o Leon Revil:",
        erro
    );
});