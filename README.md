# Leon Revil

Esse é um projeto pessoal meu. Fiz o Leon Revil para praticar Java e Node.js e mostrar um pouco do que venho aprendendo. Ele é um bot de WhatsApp que usa Node.js para se conectar e Java para cuidar de comandos e algumas funções de mídia.

Deixei o código aqui para quem quiser conhecer o projeto, baixar e testar. Ainda estou aprendendo, então pode ter bugs e coisas que precisam melhorar. Não é um produto oficial nem algo que eu esteja dizendo que está pronto para uso profissional.

## O que ele faz

- Conecta ao WhatsApp usando uma biblioteca não oficial.
- Responde a comandos como `/menu` e `/info`.
- Converte imagens e vídeos em figurinhas e também faz algumas conversões de mídia.
- Tem comandos para administrar grupos, como boas-vindas, regras e controle de links. Alguns dependem das permissões do bot no grupo.

## Antes de instalar: use uma máquina virtual, se puder

Eu recomendo testar em uma máquina virtual (VM), em vez de começar direto no seu Windows principal. A VM funciona como um computador separado dentro do seu PC e ajuda a manter os testes mais isolados.

### Como preparar a máquina virtual

1. Instale um programa de virtualização, como o [VirtualBox](https://www.virtualbox.org/).
2. Crie uma máquina virtual com Windows 10 ou 11 de 64 bits. Se puder, use o Windows 11.
3. Separe pelo menos 2 núcleos de CPU, 4 GB de RAM e 64 GB de disco virtual. Se seu PC permitir, use 8 GB de RAM.
4. Configure a rede para a máquina virtual acessar a internet. No VirtualBox, o modo NAT costuma servir.
5. Instale o Windows na VM e confira se a internet está funcionando.
6. Antes de instalar o Leon, crie um snapshot da máquina virtual. Assim, fica mais fácil voltar ao estado anterior se precisar.

Para conectar o WhatsApp, use uma conta que você controla. Se puder, use uma conta ou número separado para os testes. A VM ajuda a isolar o ambiente, mas não elimina os riscos de usar uma integração não oficial.

## Opção 1: instalar e testar

Esse é o jeito mais simples. O instalador já vem com Node.js, Java, dependências e ferramentas de mídia. Você não precisa instalar tudo isso separadamente.

### Passo a passo

1. Entre na página de [Releases do Leon Revil](https://github.com/benniiijr/leon-revil-whatsapp-bot/releases).
2. Baixe o arquivo **`Leon-Revil-Setup-1.0.0-FULL.exe`**. Se preferir, [clique aqui para baixar a versão 1.0.0](https://github.com/benniiijr/leon-revil-whatsapp-bot/releases/download/v1.0.0/Leon-Revil-Setup-1.0.0-FULL.exe).
3. O Windows pode mostrar um aviso porque o instalador não tem assinatura digital. Confira se baixou o arquivo da página oficial do projeto e não desative o antivírus para instalar.
4. Abra o instalador e siga as instruções. O local padrão é `C:\\LeonRevil`. Você pode escolher outro diretório durante a instalação.
5. Se quiser, marque a opção para criar um atalho na área de trabalho. Também será criado um atalho no menu Iniciar.
6. No fim da instalação, abra o Leon pelo atalho.
7. Uma janela de terminal vai aparecer. Na primeira vez, o Leon deve mostrar um QR Code para conectar ao WhatsApp.
8. No celular da conta que você vai usar, abra o WhatsApp e entre em **Dispositivos conectados → Conectar dispositivo**. O nome pode mudar um pouco dependendo do celular.
9. Escaneie o QR Code que aparece no terminal. Não compartilhe esse código com ninguém.
10. Espere a conexão. Quando der certo, deve aparecer uma mensagem parecida com `Leon Revil conectado ao WhatsApp.`.
11. Para testar, mande `/menu` ou `/info` para o bot usando outra conversa ou conta. Faça os primeiros testes em uma conversa ou grupo de teste. Teste os comandos de administração somente em um grupo seu.

O instalador não precisa baixar os programas durante a instalação, mas o Leon precisa de internet para se conectar ao WhatsApp enquanto estiver funcionando.

### Como fechar e abrir de novo

- Para fechar o bot quando ele foi iniciado pelo atalho, vá até a janela do terminal e pressione **Ctrl+C**.
- Para abrir novamente, use o atalho **Leon Revil**.
- Os dados de conexão ficam na pasta `whatsapp-bridge\\auth-leon`, dentro da instalação. Não compartilhe essa pasta nem envie para outras pessoas.
- Antes de desinstalar, confira se precisa guardar alguma coisa da sua sessão.

### Iniciar automaticamente com o Windows

Depois de conectar o WhatsApp pela primeira vez, você pode configurar o Agendador de Tarefas para iniciar o Leon quando entrar no Windows. Assim, não precisa abrir o atalho manualmente a cada inicialização.

1. Confirme que o Leon já conectou ao WhatsApp pelo menos uma vez e que a sessão foi salva.
2. Pressione **Win + R**, digite `taskschd.msc` e pressione Enter.
3. No Agendador de Tarefas, clique em **Criar Tarefa**.
4. Na aba **Geral**, dê o nome `Leon Revil` e selecione **Executar independentemente de o usuário estar conectado ou não**. O Windows pode solicitar a senha da sua conta.
5. Na aba **Disparadores**, clique em **Novo...** e escolha **Ao fazer logon**. Se quiser, deixe para qualquer usuário ou selecione sua conta.
6. Na aba **Ações**, clique em **Novo...** e configure:
   - **Ação:** Iniciar um programa.
   - **Programa/script:** caminho completo do arquivo `iniciar-leon.bat`. Na instalação padrão: `C:\\LeonRevil\\iniciar-leon.bat`.
   - **Iniciar em (opcional):** pasta de instalação. Na instalação padrão: `C:\\LeonRevil`.
   - Se você escolheu outro diretório durante a instalação, use o caminho correspondente.
7. Salve a tarefa. Se o Windows solicitar credenciais, informe a senha da conta usada para executar o Leon.

A tarefa será executada em segundo plano quando você entrar no Windows, sem deixar a janela do terminal aberta na área de trabalho. Para conferir, abra o Agendador de Tarefas e veja se a tarefa **Leon Revil** está em execução.

**Atenção:**
- Faça a primeira conexão pelo atalho normal, com o terminal visível, antes de configurar a inicialização automática. Se a sessão expirar ou o WhatsApp pedir um novo QR Code, inicie o Leon manualmente pelo atalho para conectar novamente.
- Não abra o atalho enquanto a tarefa automática já estiver executando, para evitar duas instâncias do bot.
- Para interromper o Leon iniciado pela tarefa, abra o Agendador de Tarefas, selecione **Leon Revil** e clique em **Finalizar**. Para voltar a iniciar manualmente, você pode desabilitar a tarefa.
- A inicialização automática depende de o computador estar ligado, de você entrar na conta configurada e de haver conexão com a internet.

Se preferir que o terminal apareça, não configure a tarefa em segundo plano: continue usando o atalho **Leon Revil** normalmente.

### Se der algum problema

- **O QR Code não aparece:** confira a internet da VM e tente abrir o Leon de novo.
- **O celular não conecta:** reinicie o Leon para gerar outro QR Code e tente novamente.
- **O bot conecta, mas não responde:** teste `/menu` e `/info` usando outra conta e veja se aparece algum erro no terminal.
- **Os comandos de grupo não funcionam:** confira as permissões do bot e de quem está usando o comando.
- **As conversões de mídia falham:** tente com um arquivo menor e confira as mensagens do terminal.

## Opção 2: baixar o código para estudar

Se você quiser ver como o projeto foi feito e executar o código por conta própria, também pode baixar os arquivos. Nesse caso, os programas que vêm dentro do instalador não serão instalados automaticamente.

### O que precisa instalar

- Windows 10 ou 11 de 64 bits.
- Git.
- Node.js 24.
- JDK 21, com `java` e `javac`.
- FFmpeg, FFprobe e ImageMagick no PATH do Windows, para as funções de mídia.

### Baixar o código

Você pode clicar em **Code → Download ZIP** aqui no GitHub e extrair o arquivo, ou abrir o PowerShell e executar:

```powershell
git clone https://github.com/benniiijr/leon-revil-whatsapp-bot.git
cd leon-revil-whatsapp-bot
```

### Compilar o Java e instalar as dependências

Na pasta principal do projeto, execute no PowerShell:

```powershell
# Criar a pasta dos arquivos compilados
New-Item -ItemType Directory -Force .\\build\\classes

# Compilar o código Java usando o JDK 21
$fontes = Get-ChildItem .\\src\\*.java | ForEach-Object { $_.FullName }
javac --release 21 -encoding UTF-8 -d .\\build\\classes $fontes
```

Depois, instale as dependências do Node.js e inicie o bot:

```powershell
cd .\\whatsapp-bridge
npm ci
node index.js
```

Na primeira execução, siga os passos do QR Code explicados na Opção 1. Deixe o terminal aberto enquanto estiver usando o bot. Se fechar a janela, o processo será encerrado.

### Sobre suas próprias alterações

Esse repositório é para apresentar o meu projeto. Você pode baixar o código e estudar como ele funciona, mas não precisa enviar alterações para cá.

Se quiser fazer sua própria versão, trabalhe em uma cópia sua e guarde o código no seu próprio repositório.

Não compartilhe a pasta `whatsapp-bridge\\auth-leon`, QR Codes, senhas, tokens, arquivos de sessão ou dados de conversas. Antes de compartilhar sua cópia, confira também quais arquivos estão incluídos.

## Pastas principais

- `src/`: código Java do Leon.
- `whatsapp-bridge/`: conexão com o WhatsApp e integração com Java.
- `whatsapp-bridge/services/`: serviços usados pelo bot.
- `build/classes/`: arquivos Java gerados durante a compilação.

## Avisos

- Esse é meu projeto pessoal de estudo e apresentação. Ainda estou aprendendo e ele pode ter erros.
- O projeto não é oficial e não tem ligação com o WhatsApp ou com a Meta.
- A conexão usa uma biblioteca não oficial e pode parar de funcionar ou sofrer restrições. Use somente uma conta que você tem autorização para conectar.
- O instalador inclui programas de terceiros. As informações de licença ficam nos arquivos distribuídos com eles.
- A licença do código está no arquivo [LICENSE](LICENSE). Os programas de terceiros podem ter licenças próprias.
