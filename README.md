# Sensor Flow API

**Sensor Flow API** é uma API desenvolvida para receber, processar e gerenciar registros de sensores.

---

## Funcionalidades Implementadas

### **Autenticação**
A API conta com um sistema de autenticação baseado em **Cognito**, com suporte a cookies HTTP-only para segurança. A autenticação atual permite:

- **Login**: Autenticação de usuários utilizando `username` e `password`.
  - Gera um token JWT com validade de 1 hora.
  - O token é armazenado em um cookie seguro `httpOnly`.

#### **Endpoints**

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

---

### **Registro de Sensores**

#### **Endpoints**

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
    - `id` (UUID gerado automaticamente)
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

---

### **Listagem de Dados Agregados**

#### **Endpoints**

- **GET `/sensor-data/aggregated`**
  - Consulta dados agregados da tabela `aggregated` no DynamoDB.
  - Suporta filtros dinâmicos:
    - `24h`: últimas 24 horas
    - `48h`: últimas 48 horas
    - `1w`: última semana
    - `1m`: último mês
  - Parâmetros de consulta:
    - `interval`: Especifica o intervalo de tempo (`24h`, `48h`, `1w`, `1m`).

  - Exemplo de requisição:
    ```http
    GET /sensor-data/aggregated?interval=24h
    ```

  - Exemplo de resposta:
    ```json
    {
      "average": 78.42,
      "totalCount": 20,
      "items": [
        {
          "equipmentId": "EQ-12495",
          "intervalStart": 1693468800,
          "totalValue": 1500.75,
          "sampleCount": 20
        }
      ]
    }
    ```

---

### **Processamento de Arquivos com Lambda**

Uma função Lambda em Python é responsável por processar os arquivos CSV enviados para o S3. Esta função:
- Lê o arquivo CSV utilizando `pandas`.
- Insere cada linha do arquivo no DynamoDB com as colunas:
  - `id` (UUID gerado automaticamente)
  - `equipmentId`
  - `timestamp`
  - `value`
  - `register_time`

---

### **Popular Dados Agregados**

Uma função Lambda em python é acionada via **DynamoDB Streams** para popular a tabela de agregados com base nos dados da tabela de escrita. Esta função:

1. Processa eventos do **DynamoDB Streams**.
2. Para cada evento:
   - Extrai as informações do equipamento, timestamp e valor.
   - Determina o intervalo de tempo (`intervalStart` arredondado para a hora cheia).
   - Atualiza ou cria o registro correspondente na tabela de agregados.
3. A tabela de agregados tem as seguintes colunas:
   - `partitionKey`: Valor fixo (`GLOBAL`) para consultas eficientes.
   - `equipmentId`: Identificação do equipamento.
   - `intervalStart`: Timestamp do início do intervalo.
   - `totalValue`: Soma dos valores agregados.
   - `sampleCount`: Número de amostras no intervalo.

## **Estrutura Modular**

A aplicação foi projetada com uma estrutura modular utilizando o framework **NestJS**.

#### **Módulos**

1. **Auth Module**:
   - Implementa a autenticação via Cognito.
   - Inclui estratégias JWT para validação.
   - Contém:
     - `AuthController`
     - `AuthService`
     - `JwtStrategy`

2. **SensorData Module**:
   - Gerencia o registro de dados de sensores e upload de arquivos CSV.
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
- **AWS S3**
- **AWS Lambda**
- **Python**

---

## Infraestrutura e CI/CD

A aplicação utiliza **AWS SAM** para definição da infraestrutura como código e **AWS CodeBuild** para pipelines de CI/CD. A seguir, detalhamos os principais arquivos de configuração utilizados.

### Infraestrutura com AWS SAM

O arquivo `template.yaml` define os recursos necessários na AWS para a aplicação **Sensor Flow**, incluindo buckets S3, tabelas DynamoDB, funções Lambda e repositórios ECR.

### Pipelines de Build com AWS CodeBuild

Existem dois arquivos `buildspec` para gerenciar diferentes partes da aplicação:

1. **buildspec.yml**: Para construir e empacotar as funções Lambda e a infraestrutura com AWS SAM.
2. **buildspec-nest.yml**: Para construir e publicar a aplicação NestJS no Amazon ECR.

---

## Como Executar o Projeto

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/sensor-flow.git
   cd sensor-flow
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente no arquivo `.env`:**
   ```
   AWS_REGION=seu-regiao
   COGNITO_CLIENT_ID=seu-client-id
   COGNITO_CLIENT_SECRET=seu-client-secret
   COGNITO_AUTH_URI=seu-auth-uri
   DYNAMODB_TABLE_NAME=sensor-data-table
   DYNAMODB_AGGREGATE_TABLE_NAME=aggregated-data-table
   S3_BUCKET_NAME=sensor-data-bucket
   ```

4. **Execute a aplicação:**
   ```bash
   npm run start
   ```