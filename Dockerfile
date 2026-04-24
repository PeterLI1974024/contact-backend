# 使用 Node.js 官方 Image
FROM node:18

# 設定容器內的工作目錄
WORKDIR /app

# 先複製 package.json 並安裝套件 (利用快取加速)
COPY package*.json ./
RUN npm install

# 複製其餘程式碼
COPY . .

# 開放 3000 Port
EXPOSE 3000

# 啟動指令
CMD ["node", "index.js"]