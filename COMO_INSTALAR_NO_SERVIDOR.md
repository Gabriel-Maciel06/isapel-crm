# 📁 Como Colocar o CRM na Pasta Compartilhada do Servidor Isapel

Este sistema foi projetado para funcionar com **Arquitetura Dual (Rede Local + Nuvem Gratuita)**:
1. **Pasta de Rede do Servidor**: Apenas quem tem acesso à pasta compartilhada da Isapel consegue abrir o aplicativo.
2. **Nuvem (Supabase)**: Os dados e movimentações de Gabriel Maciel, Fernanda e Caio são sincronizados em tempo real instantaneamente.
3. **Backup Local na Rede**: Toda a base fica salva em `data/database-backup.json` na própria rede da empresa.

---

## 🚀 Como Disponibilizar para os Vendedores:

### 1. Copie a pasta `isapel-crm` para o Servidor
Copie a pasta inteira para o compartilhamento de rede da Isapel, por exemplo:
- `\\SERVIDOR\Comercial\CRM_Isapel\` (Windows)
- Ou `/Volumes/Comercial/CRM_Isapel/` (Mac)

### 2. Criar o Atalho na Área de Trabalho do Vendedor
- **No Windows**:
  - Clique com o botão direito no arquivo **`Abrir CRM Isapel.bat`** -> **Enviar para** -> **Área de trabalho (criar atalho)**.
  - Renomeie o atalho para **CRM Isapel**.
  - *(Opcional)* Clique com o botão direito no atalho -> Propriedades -> Alterar Ícone -> Selecione o arquivo de ícone/logo da Isapel.

- **No Mac**:
  - Dê 2 cliques diretamente no arquivo **`Abrir CRM Isapel.command`**.

---

## ⚡ Como Funciona no Dia a Dia:
- O vendedor dá 2 cliques no ícone na Área de Trabalho.
- O CRM abre como um aplicativo executivo (janela limpa, sem barra de endereços).
- Se o Gabriel cadastrar um novo cliente, a Fernanda e o Caio já recebem o cliente no Funil e o placar da Arena 3D é atualizado automaticamente.
- Se a internet cair, o sistema continua funcionando normalmente gravando localmente na pasta de rede da Isapel!
