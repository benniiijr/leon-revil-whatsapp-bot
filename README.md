# Leon Revil

Esse é um projeto pessoal que desenvolvi para estudar, praticar e apresentar um pouco do que venho aprendendo em **Java e Node.js**. O Leon Revil é um bot para WhatsApp que usa Node.js para fazer a conexão e uma ponte com Java para processar comandos e algumas funções de mídia.

A ideia deste repositório é apresentar meu projeto para quem quiser **instalar e testar**, conhecer o funcionamento ou baixar o código para **estudar e executar localmente**. Se você quiser desenvolver uma versão própria, mantenha seu trabalho em uma cópia e em um repositório seus. É um projeto independente, feito para aprendizado e apresentação — não é um produto oficial nem uma solução que eu esteja prometendo como pronta para uso em produção.

## O que ele faz

- Conecta ao WhatsApp por meio de uma integração não oficial.
- Responde a comandos como `/menu` e `/info`.
- Tem funções para converter imagens e vídeos em figurinhas e figurinhas em mídia.
- Inclui comandos de administração de grupos, como remoção de participante, regras, boas-vindas e controle de links, conforme as permissões e configurações do grupo.

Alguns comandos administrativos só funcionam quando o Leon tem as permissões necessárias no grupo.

## Antes de começar: recomendo usar uma máquina virtual

Como este é um projeto pessoal de teste e usa uma integração não oficial com o WhatsApp, **recomendo testar em uma máquina virtual (VM)** em vez de começar pelo seu Windows principal.

Uma VM funciona como um computador separado dentro do seu computador. Assim, você pode testar o instalador em um ambiente isolado e criar um ponto de restauração antes de começar.

### Preparar a máquina virtual

1. Instale um virtualizador, como o [VirtualBox](https://www.virtualbox.org/), ou use uma solução de virtualização que já tenha disponível.
2. Crie uma máquina virtual com Windows 10 ou 11 de **64 bits**. Se possível, prefira Windows 11 e use uma instalação/licença válida.
3. Como ponto de partida, reserve **2 núcleos de CPU, 4 GB de RAM (8 GB se puder) e pelo menos 64 GB de disco virtual**. Ajuste conforme os recursos do seu computador.
4. Configure a rede da VM para ter acesso à internet. No VirtualBox, o modo **NAT** costuma ser suficiente para esse teste.
5. Instale o Windows, conclua a configuração inicial e confirme que a internet está funcionando.
6. Antes de instalar o Leon, crie um **snapshot/ponto de restauração** da VM. Se quiser recomeçar os testes, poderá voltar a esse estado.

Para autenticar o WhatsApp, use somente uma conta que você controla. Se possível, use uma conta ou número separado para testes. A integração não oficial pode parar de funcionar ou estar sujeita a restrições da plataforma; a máquina virtual não elimina esses riscos.

## Opção 1 — Instalar e testar o Leon Revil

Esta é a opção mais simples. O instalador completo já inclui os componentes necessários para executar o projeto, como Node.js, Java, dependências do Node e ferramentas de mídia. **Você não precisa instalar Node.js, Java, FFmpeg ou ImageMagick separadamente para usar essa versão do instalador.**

### Passo a passo

1. Abra a página de [Releases do Leon Revil](https://github.com/benniiijr/leon-revil-whatsapp-bot/releases).
2. Na versão desejada, baixe o arquivo **`Leon-Revil-Setup-1.0.0-FULL.exe`**. Você também pode [baixar diretamente o instalador v1.0.0](https://github.com/benniiijr/leon-revil-whatsapp-bot/releases/download/v1.0.0/Leon-Revil-Setup-1.0.0-FULL.exe).
3. Aguarde o download terminar. Se o Windows mostrar um aviso de aplicativo não reconhecido, lembre-se de que este instalador não possui assinatura digital. Confira se o arquivo veio do Release oficial e não desative o antivírus para executá-lo.
4. Abra o instalador e siga as etapas apresentadas. Por padrão, ele instala o Leon no perfil do usuário, em `%LOCALAPPDATA%\Programs\Leon Revil`, sem precisar instalar os runtimes manualmente.
5. Se quiser, marque a opção para criar um atalho na área de trabalho. O instalador também cria um atalho no menu Iniciar.
6. Ao terminar, deixe marcada a opção para iniciar o Leon ou abra o atalho **Leon Revil** no menu Iniciar.
7. Uma janela de terminal será aberta. Na primeira execução, o bot deve tentar conectar ao WhatsApp e exibir um **QR Code** no terminal.
8. No celular que contém a conta que será usada pelo bot, abra o WhatsApp e entre em **Configurações (ou menu) → Dispositivos conectados → Conectar dispositivo**. A nomenclatura pode variar um pouco conforme o aparelho.
9. Use o celular para escanear o QR Code que aparece na janela do Leon. Não compartilhe esse QR Code nem os arquivos de autenticação.
10. Aguarde a conexão. Quando der certo, o terminal deverá mostrar uma mensagem semelhante a **`Leon Revil conectado ao WhatsApp.`**.
11. Para testar, envie **`/menu`** ou **`/info`** para a conta do bot a partir de outra conversa ou conta de teste. O comando `/menu` apresenta os comandos disponíveis. Teste primeiro em uma conversa ou grupo de teste; ações administrativas devem ser experimentadas somente em um grupo seu, onde você entende as permissões envolvidas.

O instalador não precisa baixar os runtimes durante a instalação, mas **o bot precisa de internet enquanto estiver em execução** para se conectar ao WhatsApp.

### Encerrar e abrir novamente

- Para encerrar o processo, volte à janela do terminal e pressione **Ctrl+C**.
- Para iniciar de novo, abra o atalho **Leon Revil**.
- A autenticação fica armazenada localmente na pasta `whatsapp-bridge\auth-leon`, dentro da instalação. Ela não deve ser publicada nem enviada a outras pessoas.
- Não compartilhe a pasta de autenticação. Se for desinstalar, confira antes se precisa manter sua sessão local.

### Se não funcionar

- **O QR Code não aparece:** confira se a VM tem internet e aguarde alguns instantes. Se continuar sem aparecer, feche o terminal, abra o Leon novamente e leia a mensagem de erro exibida.
- **O celular não conecta:** reinicie o Leon para gerar um QR Code novo e tente escanear novamente. Não publique imagens do QR Code.
- **O bot conecta, mas não responde:** teste `/menu` e `/info` a partir de outra conta ou conversa e confira o terminal em busca de erros.
- **Comandos administrativos falham:** verifique se a conta do Leon e quem executa o comando têm as permissões necessárias no grupo.
- **Recursos de mídia falham:** envie arquivos de teste menores e confira as mensagens do terminal. Nem todo arquivo de imagem ou vídeo é necessariamente compatível.

## Opção 2 — Baixar o código para estudar ou executar localmente

Se a ideia for estudar a implementação, modificar o comportamento ou versionar suas alterações, você pode baixar o código-fonte. Nesse caminho, os runtimes e as ferramentas que vêm dentro do instalador completo **não são instalados automaticamente**.

### Requisitos para executar pelo código

- Windows 10 ou 11 de 64 bits.
- Git (para clonar e versionar o repositório).
- Node.js 24.
- JDK 21, incluindo `java` e `javac`.
- FFmpeg, FFprobe e ImageMagick disponíveis no `PATH` do Windows para os recursos de mídia.

### Baixar o projeto

Você pode clicar em **Code → Download ZIP** nesta página e extrair o arquivo, ou usar o Git:

```powershell
git clone https://github.com/benniiijr/leon-revil-whatsapp-bot.git
cd leon-revil-whatsapp-bot
```

### Instalar dependências e compilar o Java

No PowerShell, a partir da pasta raiz do projeto, execute:

```powershell
# Criar a pasta que receberá os arquivos compilados
New-Item -ItemType Directory -Force .\build\classes

# Compilar as classes Java usando o JDK 21
$fontes = Get-ChildItem .\src\*.java | ForEach-Object { $_.FullName }
javac --release 21 -encoding UTF-8 -d .\build\classes $fontes
```

Depois instale as dependências do Node.js e inicie a ponte com o WhatsApp:

```powershell
cd .\whatsapp-bridge
npm ci
node index.js
```

Na primeira execução, siga o mesmo procedimento de autenticação pelo QR Code explicado na Opção 1. Mantenha o terminal aberto enquanto estiver usando o bot; fechar o terminal encerra o processo.

### Manter seus estudos separados deste repositório

Este repositório é a apresentação do meu projeto pessoal. As instruções acima servem para baixar o código, estudar e executar uma cópia local; não é necessário enviar alterações para cá.

Se decidir transformar o código em um projeto seu, faça isso em uma cópia própria e mantenha o desenvolvimento no seu próprio repositório.

**Não publique** a pasta `whatsapp-bridge\\auth-leon`, QR Codes, credenciais, arquivos de sessão, chaves, tokens, logs pessoais ou dados de conversas. A pasta de autenticação é local e deve continuar privada. O `.gitignore` do projeto já exclui alguns arquivos gerados, mas sempre confira os arquivos antes de compartilhar sua cópia.

## Estrutura principal do projeto

- `src/`: código Java do Leon, personalidade e processamento de mídia.
- `whatsapp-bridge/`: conexão com o WhatsApp e ponte Node.js ↔ Java.
- `whatsapp-bridge/services/`: serviços de mensagens, mídia e integração.
- `build/classes/`: classes Java compiladas localmente; são geradas durante a compilação.

## Avisos

- Este é meu projeto pessoal de estudo e apresentação. Ainda pode conter erros e mudanças; use por sua conta e risco.
- O projeto não é afiliado, patrocinado nem oficialmente endossado pelo WhatsApp ou pela Meta.
- A conexão utiliza uma biblioteca não oficial e pode sofrer alterações, interrupções ou restrições impostas pela plataforma. Respeite os termos aplicáveis e use somente contas que você tem autorização para conectar.
- O instalador inclui componentes de terceiros. Consulte os avisos e licenças distribuídos com esses componentes e os respectivos projetos oficiais.
- O código deste repositório está disponibilizado sob a licença indicada no arquivo [LICENSE](LICENSE). Isso não substitui as licenças dos componentes de terceiros incluídos no instalador.
