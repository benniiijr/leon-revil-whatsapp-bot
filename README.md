# Leon Revil

Bot para WhatsApp desenvolvido em Java e Node.js. O projeto utiliza uma ponte entre as duas tecnologias para processar mensagens e executar as funções implementadas.

## Requisitos

- Windows 10 ou 11.
- Conexão com a internet durante a instalação.
- Node.js 24.
- JDK 21 ou superior, com `java` e `javac` disponíveis.
- PowerShell.

O instalador tenta instalar as dependências necessárias quando elas não estão disponíveis.

## Instalação simplificada

1. Baixe o projeto pelo botão **Code > Download ZIP** no GitHub.
2. Extraia o ZIP para uma pasta.
3. Execute `install.bat`.
4. Autorize a elevação de privilégios, caso solicitada.
5. Siga as instruções apresentadas pelo instalador.
6. Depois da instalação, execute `C:\LeonRevil\iniciar-leon.bat`.

O instalador precisa de acesso à internet para baixar as dependências.

## Execução e autenticação

Na primeira execução, o Baileys poderá apresentar um QR Code para autenticação.

Cada usuário deve autenticar somente a própria conta e manter os arquivos de sessão em segurança. A sessão é criada localmente durante a execução e não faz parte do código publicado neste repositório.

Não compartilhe o QR Code, os arquivos de autenticação ou a pasta `auth-leon`.

## Recursos de mídia

Algumas conversões de imagens, vídeos e figurinhas dependem de ferramentas externas, como ImageMagick, FFmpeg e FFprobe. Essas ferramentas não são instaladas automaticamente pela versão atual do instalador.

Se uma função de mídia não funcionar, verifique se as ferramentas necessárias estão instaladas e disponíveis no PATH do Windows.

## Código-fonte

O código Java fica em `src/`, e a ponte Node.js fica em `whatsapp-bridge/`.

Para instalar as dependências do Node.js manualmente, entre na pasta `whatsapp-bridge` e execute:

```powershell
npm ci
```

A compilação Java utiliza `javac --release 21`.

## Desinstalação

Execute `uninstall.bat` e siga as confirmações. O desinstalador permite preservar uma cópia da sessão antes de remover a instalação.

**Atenção:** se você optar por não preservar a sessão, ela será removida junto com a instalação.

## Aviso

Este é um projeto independente, sem afiliação oficial com WhatsApp ou Meta. O uso de integrações não oficiais pode estar sujeito a limitações, alterações ou bloqueios da plataforma. Utilize por sua conta e risco e respeite os termos de serviço aplicáveis.