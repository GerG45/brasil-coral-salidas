(function (root) {
  'use strict';
  const core = typeof module !== 'undefined' ? require('./core.js') : root.Coral;
  const currencies = ['ARS', 'USD', 'BRL'];
  const maxCents = 1000000000000;
  const validId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id);
  const neutralColor = Object.freeze({id: '', label: 'Sin color', accent: '#6b7280', tint: '#ffffff'});
  const palette = Object.freeze([
    ['red', 'Rojo', '#be123c', '#fff1f2'],
    ['coral', 'Coral', '#c2413b', '#fff0eb'],
    ['orange', 'Naranja', '#c2410c', '#fff4e6'],
    ['amber', 'Ámbar', '#a16207', '#fff7dc'],
    ['yellow', 'Amarillo', '#8a7200', '#fffbd9'],
    ['lime', 'Lima', '#4d7c0f', '#f3f9dc'],
    ['green', 'Verde', '#15803d', '#eaf8e8'],
    ['mint', 'Menta', '#047857', '#e7f9f0'],
    ['teal', 'Turquesa', '#0e7490', '#e5f7f8'],
    ['sky', 'Celeste', '#0369a1', '#e9f6ff'],
    ['blue', 'Azul', '#1d4ed8', '#edf3ff'],
    ['indigo', 'Índigo', '#4338ca', '#eeedff'],
    ['violet', 'Violeta', '#7e22ce', '#f5eafe'],
    ['magenta', 'Fucsia', '#a21caf', '#fbeafa'],
    ['pink', 'Rosa', '#be185d', '#ffedf5'],
    ['brown', 'Tierra', '#854d31', '#f6ede4']
  ].map(([id, label, accent, tint]) => Object.freeze({id, label, accent, tint})));

  function colorFor(sale) {
    return palette.find(color => color.id === sale?.color) || neutralColor;
  }

  function blankSale() {
    return {
      id: core.uid(), name: '', representative: '', whatsapp: '', email: '',
      status: 'interested', currency: 'ARS', totalCents: 0, tripId: '', people: 0,
      notes: '', color: '', installments: []
    };
  }

  function today() {
    const date = new Date();
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
      .map(part => String(part).padStart(2, '0')).join('-');
  }

  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }

  function validCents(amount, minimum) {
    return Number.isSafeInteger(amount) && amount >= minimum && amount <= maxCents;
  }

  function parseAmount(value) {
    let text = String(value ?? '').trim();
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(text)) text = text.replace(/\./g, '');
    const parts = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(text);
    if (!parts) throw Error('Ingresá un importe válido con hasta dos decimales.');
    const cents = Number(parts[1]) * 100 + Number((parts[2] || '').padEnd(2, '0'));
    if (!validCents(cents, 0)) throw Error('El importe supera el máximo permitido.');
    return cents;
  }

  function validateText(text, label, maxLength) {
    if (typeof text !== 'string' || text.length > maxLength) throw Error(`${label}: máximo ${maxLength} caracteres.`);
  }

  function validateSale(sale) {
    if (!sale || !validId(sale.id)) throw Error('Coro inválido.');
    for (const [key, label, max] of [
      ['name', 'Nombre del coro', 160], ['representative', 'Representante', 160],
      ['whatsapp', 'WhatsApp', 64], ['email', 'Correo', 254], ['notes', 'Notas', 2000]
    ]) validateText(sale[key], label, max);
    if (!sale.name.trim()) throw Error('Ingresá el nombre del coro.');
    if (sale.color !== undefined && sale.color !== '' && !palette.some(color => color.id === sale.color)) {
      throw Error('Elegí un color de la paleta.');
    }
    if (sale.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sale.email)) throw Error('Ingresá un correo válido.');
    if (!['interested', 'confirmed'].includes(sale.status)) throw Error('Elegí un estado válido.');
    if (!currencies.includes(sale.currency)) throw Error('Elegí una moneda válida.');
    if (sale.tripId !== '' && !validId(sale.tripId)) throw Error('La salida vinculada no es válida.');
    if (!Number.isSafeInteger(sale.people) || sale.people < 0 || sale.people > 10000) throw Error('Ingresá una cantidad válida de personas.');
    if (!validCents(sale.totalCents, 0)) throw Error('Ingresá un importe total válido.');
    if (!Array.isArray(sale.installments)) throw Error('El plan de cuotas no es válido.');

    const installmentIds = new Set();
    const paymentIds = new Set();
    let scheduledCents = 0;
    for (const installment of sale.installments) {
      if (!installment || !validId(installment.id) || installmentIds.has(installment.id)) throw Error('Cuota inválida o repetida.');
      installmentIds.add(installment.id);
      if (!validDate(installment.dueDate)) throw Error('Ingresá una fecha de vencimiento válida.');
      if (!validCents(installment.amountCents, 1)) throw Error('El importe de la cuota debe ser mayor que cero.');
      if (!Array.isArray(installment.payments)) throw Error('La lista de pagos no es válida.');
      scheduledCents += installment.amountCents;
      if (scheduledCents > sale.totalCents) throw Error('La suma de las cuotas supera el total acordado.');

      let paidCents = 0;
      for (const payment of installment.payments) {
        if (sale.status !== 'confirmed') throw Error('Confirmá el coro para registrar pagos.');
        if (!payment || !validId(payment.id) || paymentIds.has(payment.id)) throw Error('Pago inválido o repetido.');
        paymentIds.add(payment.id);
        if (!validDate(payment.date)) throw Error('Ingresá una fecha de pago válida.');
        if (!validCents(payment.amountCents, 1)) throw Error('El importe del pago debe ser mayor que cero.');
        validateText(payment.method, 'Medio de pago', 100);
        validateText(payment.note, 'Nota del pago', 500);
        paidCents += payment.amountCents;
        if (paidCents > installment.amountCents) throw Error('El pago supera el saldo de la cuota.');
      }
    }
    if (new TextEncoder().encode(JSON.stringify(sale)).length > 100000) throw Error('La ficha del coro supera el tamaño permitido.');
    return sale;
  }

  function installmentStatus(installment, asOf = today()) {
    const paidCents = installment.payments.reduce((sum, payment) => sum + payment.amountCents, 0);
    const balanceCents = installment.amountCents - paidCents;
    let status = 'pending';
    if (balanceCents === 0) status = 'paid';
    else if (installment.dueDate < asOf) status = 'overdue';
    else if (paidCents > 0) status = 'partial';
    return { paidCents, balanceCents, status };
  }

  function summary(sales, asOf = today()) {
    const result = { interested: 0, confirmed: 0, byCurrency: {} };
    for (const sale of sales) {
      result[sale.status]++;
      if (sale.status !== 'confirmed') continue;
      const totals = result.byCurrency[sale.currency] ??= { soldCents: 0, paidCents: 0, balanceCents: 0, overdueCents: 0 };
      totals.soldCents += sale.totalCents;
      totals.balanceCents += sale.totalCents;
      for (const installment of sale.installments) {
        const { paidCents, balanceCents, status } = installmentStatus(installment, asOf);
        totals.paidCents += paidCents;
        totals.balanceCents -= paidCents;
        if (status === 'overdue') totals.overdueCents += balanceCents;
      }
    }
    return result;
  }

  const api = { blankSale, validateSale, parseAmount, today, installmentStatus, summary, palette, colorFor };
  if (typeof module !== 'undefined') module.exports = api;
  else root.CoralSales = api;
})(globalThis);
