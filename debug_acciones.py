import yfinance as yf
import pandas as pd
import datetime

tickers = ['MSFT', 'NVDA', 'INTC', 'AMD', 'TSM']
end_date = datetime.datetime.now()
start_date = end_date - datetime.timedelta(days=3*365)

print("Descargando datos...")
data = yf.download(tickers, start=start_date, end=end_date)
print("Tipo de datos:", type(data))
print("Columnas:", data.columns)
print("Primeras filas:")
print(data.head())
