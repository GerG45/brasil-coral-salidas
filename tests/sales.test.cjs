const assert = require('node:assert/strict');
const { test } = require('node:test');
const Sales = require('../dist/sales-model.js');

test('El resumen separa monedas y cuenta cobros parciales y saldos sin planificar', () => {
  const pesoSale = {
    ...Sales.blankSale(), name: 'Coro del Sur', representative: 'Ana',
    whatsapp: '+54 9 11 2345 6789', email: 'ana@example.com',
    status: 'confirmed', totalCents: 100000,
    installments: [{
      id: 'installment-a', dueDate: '2026-10-12', amountCents: 60000,
      payments: [
        { id: 'payment-a', date: '2026-10-08', amountCents: 12000, method: 'Transferencia', note: 'Seña' },
        { id: 'payment-b', date: '2026-10-12', amountCents: 18000, method: 'Efectivo', note: '' }
      ]
    }]
  };
  const dollarSale = { ...Sales.blankSale(), name: 'Coro del Norte', status: 'confirmed', currency: 'USD', totalCents: 55000 };
  const prospect = { ...Sales.blankSale(), name: 'Coro del Centro', totalCents: 200000 };
  const sales = [pesoSale, dollarSale, prospect].map(Sales.validateSale);
  assert.deepEqual(Sales.installmentStatus(pesoSale.installments[0], '2026-10-12'), {
    paidCents: 30000, balanceCents: 30000, status: 'partial'
  });
  assert.deepEqual(Sales.summary(sales, '2026-10-13'), {
    interested: 1,
    confirmed: 2,
    byCurrency: {
      ARS: { soldCents: 100000, paidCents: 30000, balanceCents: 70000, overdueCents: 30000 },
      USD: { soldCents: 55000, paidCents: 0, balanceCents: 55000, overdueCents: 0 }
    }
  });
});

test('Valida cuotas, centavos y fechas antes de guardar', () => {
  assert.equal(Sales.parseAmount('1.234,50'), 123450);
  assert.equal(Sales.parseAmount('0.29'), 29);
  assert.throws(() => Sales.parseAmount('1,234'), /dos decimales/);
  const sale = { ...Sales.blankSale(), name: 'Coro', status: 'confirmed', totalCents: 100 };
  const installment = { id: 'quota', dueDate: '2026-02-29', amountCents: 101, payments: [] };
  sale.installments.push(installment);
  assert.throws(() => Sales.validateSale(sale), /fecha de vencimiento/);
  installment.dueDate = '2028-02-29';
  assert.throws(() => Sales.validateSale(sale), /supera el total/);
  installment.amountCents = 100;
  installment.payments.push({ id: 'p1', date: '2026-10-01', amountCents: 101, method: '', note: '' });
  assert.throws(() => Sales.validateSale(sale), /supera el saldo/);
  installment.payments[0].amountCents = 100;
  assert.equal(Sales.validateSale(sale), sale);
  assert.equal(Sales.installmentStatus(installment, '2028-03-01').status, 'paid');
});
