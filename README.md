# Sensor Flow API

**Sensor Flow API** é uma API desenvolvida para receber registro de sensores.

## Funcionalidades Implementadas

### Autenticação
A API conta com um sistema de autenticação baseado em **Cognito**, com suporte a cookies HTTP-only para segurança. A autenticação atual permite:

- **Login**: Autenticação de usuários utilizando `username` e `password`.
  - Gera um token JWT com validade de 1 hora.
  - O token é armazenado em um cookie seguro `httpOnly`.

#### Endpoints

- **POST `/auth/login`**
  - Realiza o login utilizando credenciais no formato Basic Auth.
  - Retorna uma mensagem de sucesso e configura o cookie com o token.
  - O token JWT armazenado no cookie é validado utilizando o **Cognito JWKS URI**.

- **GET `/auth/me`**
  - Retorna as informações do usuário autenticado.
  - Requer que o usuário esteja autenticado via JWT.

- **POST `/auth/logout`**
  - Realiza o logout do usuário.
  - Remove o cookie de autenticação.

### Registro de Sensores
#### Endpoints

- **POST `/sensor-data`**
  - Recebe os dados de sensores no formato JSON:
    ```json
    {
      "equipmentId": "EQ-12495",
      "timestamp": "2023-02-15T01:30:00.000-05:00",
      "value": 78.42
    }
    ```
  - Armazena os dados no **DynamoDB** com as colunas:
    - `equipmentId`
    - `timestamp`
    - `value`
    - `register_time`

- **POST `/sensor-data/upload-csv`**
  - Recebe um arquivo CSV contendo as colunas:
    - `equipmentId`
    - `timestamp`
    - `value`
  - Armazena o arquivo CSV no **AWS S3** para processamento posterior via Lambda.
  - Retorna uma mensagem de sucesso e o nome do arquivo armazenado.

### Estrutura Modular
A aplicação foi projetada com uma estrutura modular utilizando o framework **NestJS**.

#### Módulos

1. **Auth Module**:
   - Implementa a autenticação via Cognito.
   - Inclui estratégias JWT para validação.
   - Contém:
     - `AuthController`
     - `AuthService`
     - `JwtStrategy`
2. **SensorData Module**:
   - Gerencia o registro de dados de sensores.
   - Upload de arquivos CSV
   - Contém:
     - `SensorDataController`
     - `SensorDataService`

3. **App Module**:
   - Ponto de entrada principal da aplicação.
   - Integra os módulos de autenticação e monitoramento de saúde.

4. **Config Module**:
   - Carrega variáveis de ambiente globais usando `@nestjs/config`.

---

## Tecnologias Utilizadas

- **Node.js**
- **NestJS**
- **AWS Cognito**
- **DynamoDB**

---

## Como Executar o Projeto

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/sensor-flow.git
   cd sensor-flow
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente no arquivo `.env`:
   ```
   AWS_REGION=seu-regiao
   COGNITO_CLIENT_ID=seu-client-id
   COGNITO_CLIENT_SECRET=seu-client-secret
   COGNITO_AUTH_URI=seu-auth-uri
   DYNAMODB_TABLE_NAME=sensor-data-table
   ```

4. Execute a aplicação:
   ```bash
   npm run start
   ```