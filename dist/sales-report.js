(function () {
  'use strict';

  const filterLabels = {
    all: 'Todos los coros',
    interested: 'Coros interesados',
    confirmed: 'Coros confirmados'
  };

  function money(cents, currency) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency, currencyDisplay: 'code' }).format(cents / 100);
  }

  function figures(totals, currency) {
    const values = [
      ['Acordado', totals.soldCents], ['Cobrado', totals.paidCents],
      ['Saldo', totals.balanceCents], ['Vencido', totals.overdueCents]
    ];
    return `<dl class="sales-paper-figures">${values.map(([label, cents]) =>
      `<div><dt>${label}</dt><dd>${money(cents, currency)}</dd></div>`).join('')}</dl>`;
  }

  function choirBlock(sale, trip, today) {
    const color = CoralSales.colorFor(sale);
    const confirmed = sale.status === 'confirmed';
    const totals = CoralSales.summary([sale], today).byCurrency[sale.currency];
    const next = confirmed && sale.installments.filter(installment =>
      installment.dueDate >= today && CoralSales.installmentStatus(installment, today).balanceCents > 0
    ).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    const contact = [sale.representative, sale.whatsapp && `WhatsApp ${sale.whatsapp}`, sale.email].filter(Boolean);
    return `<article class="sales-paper-choir" style="--sales-paper-accent:${color.accent};--sales-paper-tint:${color.tint}">
      <div class="sales-paper-choir-heading">
        <h2>${esc(sale.name)}</h2>
        <span>${confirmed ? 'Confirmado' : 'Interesado'}</span>
      </div>
      <p>${esc(trip?.name || 'Sin salida vinculada')}${sale.people ? ` · ${sale.people} personas` : ''}</p>
      <p><strong>Contacto</strong> ${contact.length ? contact.map(esc).join(' · ') : 'Sin registrar'}</p>
      ${confirmed ? figures(totals, sale.currency) : ''}
      ${next ? `<p><strong>Próxima cuota</strong> ${dateText(next.dueDate)} · ${money(CoralSales.installmentStatus(next, today).balanceCents, sale.currency)} de saldo</p>` : ''}
      ${sale.notes ? `<p class="sales-paper-notes"><strong>Notas</strong> ${esc(sale.notes)}</p>` : ''}
      <div class="sales-paper-followup">
        <div><strong>Próxima acción</strong><span></span></div>
        <div><strong>Fecha objetivo</strong><span></span></div>
      </div>
    </article>`;
  }

  let restorePrintArea;

  function print(sales, { filter = 'all', trips = [] } = {}) {
    const area = document.querySelector('#print-area');
    if (!area) throw Error('No se encontró el área de impresión.');
    const today = CoralSales.today();
    const summary = CoralSales.summary(sales, today);
    const tripsById = new Map(trips.map(trip => [trip.id, trip]));
    const report = document.createElement('section');
    report.className = 'sales-paper';
    report.innerHTML = `<div class="sales-paper-header">
      <span class="sales-paper-brand">BRASIL CORAL</span>
      <h1>Seguimiento de ventas</h1>
      <p>${filterLabels[filter] || filterLabels.all} · ${dateText(today)}</p>
    </div>
    <div class="sales-paper-summary">
      <p><strong>${sales.length} coros</strong> · ${summary.interested} interesados · ${summary.confirmed} confirmados</p>
      ${Object.entries(summary.byCurrency).map(([currency, totals]) => figures(totals, currency)).join('')}
    </div>
    ${sales.length ? sales.map(sale => choirBlock(sale, tripsById.get(sale.tripId), today)).join('') : '<p>No hay coros para este filtro.</p>'}`;

    restorePrintArea?.();
    const previousContent = [...area.childNodes];
    const previousTitle = document.title;
    const reportTitle = `Seguimiento de ventas - CORAL - ${today}`;
    const restore = () => {
      window.removeEventListener('afterprint', restore);
      if (report.parentNode === area) area.replaceChildren(...previousContent);
      if (document.title === reportTitle) document.title = previousTitle;
      restorePrintArea = undefined;
    };
    restorePrintArea = restore;
    area.replaceChildren(report);
    document.title = reportTitle;
    window.addEventListener('afterprint', restore, { once: true });
    try {
      window.print();
    } catch (error) {
      restore();
      throw error;
    }
  }

  window.CoralSalesReport = { print };
})();
