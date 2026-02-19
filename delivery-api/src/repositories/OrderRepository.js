import fs from 'fs/promises'; // biblioteca para ler e escrever arquivos.
import path from 'path'; // biblioteca para lidar com caminhos de arquivos.
import { fileURLToPath } from 'url'; // função para converter URL de módulo para caminho de arquivo.


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

class OrderRepository {

  constructor() {
    this.filePath = path.resolve(__dirname, '../../pedidos.json');
  }

  async readAll() { 
    const data = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(data);
  }

  async saveAll(orders) { 
    await fs.writeFile(
      this.filePath,
      JSON.stringify(orders, null, 2)
    );
  }

  async findById(orderId) { 
    const orders = await this.readAll();
    return orders.find(order => order.order_id === orderId);
  }

  async deleteById(orderId) {
    const orders = await this.readAll();
    const filtered = orders.filter(order => order.order_id !== orderId);
    await this.saveAll(filtered);
    return filtered.length !== orders.length;
  }

}

export default new OrderRepository();
