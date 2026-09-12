[README.md](https://github.com/user-attachments/files/32151080/README.md)
# Rebalancia.io — Plataforma de Rebalanceo Masivo de Carteras (WealthTech B2B)

Prototipo funcional (front-end, sin backend) de una plataforma tipo Orion/Addepar pensada
para asesores financieros independientes (idóneos CNV), Agentes de Negociación y Family
Offices en Argentina.

## El problema

Los asesores gestionan cientos de cuentas de clientes ("comitentes"). Cuando cambia la
recomendación de inversión, hoy tienen que entrar a la plataforma de cada ALyC y ejecutar
las operaciones cuenta por cuenta, a mano.

## La solución

Definir una **cartera modelo** (asignación objetivo por instrumento) y, con un clic,
generar y enviar en lote las órdenes de compra/venta necesarias para acercar a cada
comitente a esa cartera, según su perfil de riesgo y liquidez disponible — simulando el
envío vía API/FIX a las principales ALyCs (PPI, Balanz, IOL, Cocos Capital) y el
seguimiento del estado de cada orden en tiempo real vía WebSockets.

## Modelo de negocio

Suscripción mensual a asesores, AN y Family Offices, por volumen de AUM gestionado o por
cuenta. Ver el detalle simulado en el menú **Configuración → Plan de suscripción**.

