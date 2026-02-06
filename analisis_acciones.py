import yfinance as yf
import pandas as pd
import datetime
import plotly.express as px

# Definir los tickers
tickers = ['MSFT', 'NVDA', 'INTC', 'AMD', 'TSM']

# Calcular la fecha de inicio (hace 3 años)
end_date = datetime.datetime.now()
start_date = end_date - datetime.timedelta(days=4*365)

# Descargar los datos
print("Descargando datos...")
try:
    # auto_adjust=True might be helpful if we want adjusted close as 'Close'
    data = yf.download(tickers, start=start_date, end=end_date)
    
    # Check if 'Adj Close' exists, otherwise use 'Close'
    if 'Adj Close' in data.columns.get_level_values(0):
        prices = data['Adj Close']
        price_label = 'Precio de Cierre Ajustado (USD)'
    else:
        prices = data['Close']
        price_label = 'Precio de Cierre (USD)'
    
    print("Primeras filas de los precios:")
    print(prices.head())

    # Graficar los datos usando Plotly Express
    print("Generando gráfico...")
    fig = px.line(prices, 
                  title='Valor de las Acciones (Últimos 3 Años)',
                  labels={'value': price_label, 'variable': 'Tickers', 'Date': 'Fecha'})
    
    # Guardar como HTML para visualizar
    output_file = "acciones_plot.html"
    fig.write_html(output_file)
    print(f"Gráfico guardado correctamente en {output_file}")
    
except Exception as e:
    print(f"Ocurrió un error: {e}")
    import traceback
    traceback.print_exc()
