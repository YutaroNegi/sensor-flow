import requests
import random
from datetime import datetime, timedelta

def authenticate(auth_url, client_id, client_secret):
    """
    Obtém um token de autenticação.
    """
    payload = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": "default-m2m-resource-server-mztddy/read"
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    response = requests.post(auth_url, data=payload, headers=headers)
    if response.status_code == 200:
        return response.json().get('access_token')
    raise Exception(f"Erro ao obter o token: {response.status_code} {response.text}")

def generate_sensor_data(num_samples):
    """
    Gera uma lista de dados simulados para sensores.
    """
    data_list = []
    for _ in range(num_samples):
        equipment_id = f"EQ-{random.randint(10000, 99999)}"
        timestamp = (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat()
        value = round(random.uniform(50.0, 100.0), 2)
        sensor_data = {
            "equipmentId": equipment_id,
            "timestamp": timestamp,
            "value": value
        }
        data_list.append(sensor_data)
    return data_list

def send_sensor_data(api_url, token, data_list):
    """
    Envia dados do sensor para a API.
    """
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    success_count = 0
    for data in data_list:
        response = requests.post(api_url, json=data, headers=headers)
        if response.status_code in {200, 201}:
            success_count += 1
    return success_count

def main():
    """
    Exemplo de como uma máquina deve enviar payloads para uma API.
    """
    auth_url = ''
    client_id = ''
    client_secret = ''
    api_url = 'http://localhost:4000/sensor-data'
    
    token = authenticate(auth_url, client_id, client_secret)
    data_list = generate_sensor_data(10)
    success_count = send_sensor_data(api_url, token, data_list)
    print(f"{success_count}/{len(data_list)} dados enviados com sucesso!")

if __name__ == "__main__":
    main()
