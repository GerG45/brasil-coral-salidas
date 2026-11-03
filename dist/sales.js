(function () {
  'use strict';

  const statusNames = {interested: 'Interesado', confirmed: 'Confirmado'};
  const installmentNames = {pending: 'Pendiente', partial: 'Pago parcial', overdue: 'Vencida', paid: 'Pagada'};
  const currencies = [['ARS', 'Pesos argentinos (ARS)'], ['USD', 'Dólares (USD)'], ['BRL', 'Reales (BRL)']];
  const paymentMethods = ['Transferencia', 'Efectivo', 'Tarjeta', 'Otro'];

  function salesButton(label, action, cssClass = 'secondary', saleId = '', installmentId = '', paymentId = '') {
    return `<button type="button" class="${cssClass}" data-sales-action="${action}" data-sale="${esc(saleId)}" data-installment="${esc(installmentId)}" data-payment="${esc(paymentId)}">${label}</button>`;
  }

  function amountInput(label, name, cents, required = true) {
    const value = cents ? (cents / 100).toFixed(2).replace('.', ',') : '';
    return field(label, name, value, 'text', `inputmode="decimal" maxlength="20" placeholder="0,00" ${required ? 'required' : ''}`);
  }

  function formatMoney(cents, currency) {
    return new Intl.NumberFormat('es-AR', {style: 'currency', currency, currencyDisplay: 'code'}).format(cents / 100);
  }

  function colorPicker(sale) {
    const selected = CoralSales.colorFor(sale).id;
    const colors = [CoralSales.colorFor(), ...CoralSales.palette];
    return `<fieldset class="sales-color-picker span2"><legend>Color del coro</legend>
      <div class="sales-color-options">${colors.map(color => `<label class="sales-color-option">
        <input type="radio" name="color" value="${color.id}" ${selected === color.id ? 'checked' : ''}>
        <span class="sales-color-label" style="--sale-accent:${color.accent};--sale-tint:${color.tint}">
          <span class="sales-color-dot" aria-hidden="true"></span>${color.label}
        </span>
      </label>`).join('')}</div></fieldset>`;
  }

  function contacts(sale) {
    const whatsapp = sale.whatsapp && `<div><dt>WhatsApp</dt><dd>${esc(sale.whatsapp)}</dd></div>`;
    const email = sale.email && `<div><dt>Correo</dt><dd>${esc(sale.email)}</dd></div>`;
    return `<dl class="sales-contact"><div><dt>Representante</dt><dd>${esc(sale.representative || 'Sin registrar')}</dd></div>${whatsapp}${email}</dl>`;
  }

  function installmentCard(sale, installment, index, today) {
    const {paidCents, balanceCents, status} = CoralSales.installmentStatus(installment, today);
    const money = cents => formatMoney(cents, sale.currency);
    const payments = [...installment.payments].sort((a, b) => b.date.localeCompare(a.date));
    return `<section class="sales-installment">
      <div class="sales-line"><div><h4>Cuota ${index + 1}</h4><small>Vence el ${dateText(installment.dueDate)}</small></div>
      <span class="chip ${status === 'paid' ? 'green' : ''} ${status === 'overdue' ? 'sales-overdue' : ''}">${installmentNames[status]}</span></div>
      <p>${money(installment.amountCents)} · Cobrado ${money(paidCents)} · Saldo ${money(balanceCents)}</p>
      <div class="actions">${balanceCents && sale.status === 'confirmed' ? salesButton('Registrar pago', 'pay', 'primary', sale.id, installment.id) : ''}
      ${salesButton('Editar cuota', 'edit-installment', 'secondary', sale.id, installment.id)}</div>
      ${payments.length ? `<ul class="sales-payments" aria-label="Pagos de la cuota">${payments.map(payment => `
        <li class="sales-line"><div><strong>${money(payment.amountCents)}</strong><small>${dateText(payment.date)} · ${esc(payment.method)}</small>
        ${payment.note ? `<small>${esc(payment.note)}</small>` : ''}</div>
        ${salesButton('Quitar pago', 'remove-payment', 'text-button', sale.id, installment.id, payment.id)}</li>`).join('')}</ul>` : ''}
    </section>`;
  }

  function saleCard(sale, trips, open, today) {
    const color = CoralSales.colorFor(sale);
    const trip = trips.find(item => item.id === sale.tripId);
    const planned = sale.installments.reduce((sum, installment) => sum + installment.amountCents, 0);
    const {paidCents = 0, balanceCents = 0} = CoralSales.summary([sale], today).byCurrency[sale.currency] || {};
    const money = cents => formatMoney(cents, sale.currency);
    const showPlan = sale.status === 'confirmed' || sale.installments.length > 0;
    return `<article class="card sales-record${color.id ? ' sales-record-colored' : ''}" style="--sale-accent:${color.accent};--sale-tint:${color.tint}">
      <div class="sales-line"><div><h2>${esc(sale.name)}</h2><p class="muted">${sale.people ? `${sale.people} personas · ` : ''}${esc(trip?.name || 'Sin salida vinculada')}</p></div>
        <span class="chip ${sale.status === 'confirmed' ? 'green' : ''}">${statusNames[sale.status]}</span></div>
      ${contacts(sale)}
      ${sale.notes ? `<p class="sales-notes">${esc(sale.notes)}</p>` : ''}
      ${sale.status === 'confirmed' ? `<div class="sales-financials"><span>Acordado <strong>${money(sale.totalCents)}</strong></span><span>Cobrado <strong>${money(paidCents)}</strong></span><span>Saldo <strong>${money(balanceCents)}</strong></span></div>` : ''}
      <div class="actions">${salesButton('Editar ficha', 'edit', 'secondary', sale.id)}</div>
      ${showPlan ? `<details class="sales-plan" data-plan="${esc(sale.id)}" ${open ? 'open' : ''}>
        <summary>Cuotas y pagos <small>${sale.installments.length} cuotas</small></summary>
        <div class="sales-plan-body">
          ${sale.installments.length ? sale.installments.map((installment, index) => installmentCard(sale, installment, index, today)).join('') : '<p class="muted">Todavía no hay cuotas registradas.</p>'}
          ${sale.status === 'confirmed' && planned < sale.totalCents ? `<p class="muted">${money(sale.totalCents - planned)} por distribuir en cuotas.</p>${salesButton('Agregar cuota', 'new-installment', 'secondary', sale.id)}` : ''}
          ${!sale.totalCents ? '<p class="muted">Cargá el importe acordado para armar el plan de cuotas.</p>' : ''}
        </div></details>` : ''}
    </article>`;
  }

  function renderSummary(sales, today, dashboard = false) {
    const totals = CoralSales.summary(sales, today);
    return `<section class="card sales-summary" aria-label="Resumen de ventas">
      <div class="sales-line"><div><h2>${dashboard ? 'Ventas' : 'Resumen'}</h2>${dashboard ? '<p class="muted sales-dashboard-caption">Todos los coros, incluso los que todavía no tienen salida asignada.</p>' : ''}</div><div class="actions"><span class="chip">${totals.interested} interesados</span><span class="chip green">${totals.confirmed} confirmados</span>${dashboard ? '<button type="button" class="secondary" data-view="sales">Ver Ventas</button>' : ''}</div></div>
      ${Object.entries(totals.byCurrency).map(([currency, values]) => `<div class="sales-currency">
        <strong>${esc(currency)}</strong><div class="sales-financials">
        ${[['Vendido', values.soldCents], ['Cobrado', values.paidCents], ['Saldo', values.balanceCents], ['Vencido', values.overdueCents]].map(([label, amount]) => `<span>${label}<strong>${formatMoney(amount, currency)}</strong></span>`).join('')}
        </div></div>`).join('')}
    </section>`;
  }

  let dashboardRequest;
  let dashboardLoadedAt = 0;
  async function renderDashboard(main) {
    const panel = document.createElement('div');
    panel.innerHTML = '<section class="card sales-summary"><div class="sales-line"><h2>Ventas</h2><button type="button" class="secondary" data-view="sales">Ver Ventas</button></div><p role="status" class="muted">Cargando resumen de ventas…</p></section>';
    const anchor = main.querySelector('.stats') || main.querySelector('.page-heading');
    if (anchor) anchor.after(panel);
    else main.append(panel);

    if (!dashboardRequest || Date.now() - dashboardLoadedAt > 30000) {
      dashboardLoadedAt = Date.now();
      dashboardRequest = CoralCloud.listSales();
    }
    const request = dashboardRequest;
    try {
      const records = await request;
      if (panel.isConnected) panel.innerHTML = renderSummary(records.map(record => record.sale), CoralSales.today(), true);
    } catch {
      if (dashboardRequest === request) dashboardRequest = undefined;
      if (panel.isConnected) panel.querySelector('[role="status"]').textContent = 'No se pudo cargar el resumen. Podés reintentar desde Ventas.';
    }
  }

  function render(main, trips) {
    const page = document.createElement('section');
    page.className = 'sales-page';
    main.replaceChildren(page);
    let records = [];
    let filter = 'all';

    function visibleSales() {
      return records.map(record => record.sale)
        .filter(sale => filter === 'all' || sale.status === filter)
        .sort((a, b) => a.name.localeCompare(b.name, 'es-AR'));
    }

    function paint() {
      if (!page.isConnected) return;
      const openPlans = new Set(Array.from(page.querySelectorAll('details[open]'), details => details.dataset.plan));
      const today = CoralSales.today();
      const sales = records.map(record => record.sale);
      const visible = visibleSales();
      page.innerHTML = pageTitle('COMERCIAL', 'Ventas', 'Seguí a los coros desde el primer contacto hasta el último pago.', salesButton('+ Nuevo coro', 'new', 'primary')) +
        renderSummary(sales, today) + `<div class="sales-line sales-list-heading"><h2>Coros</h2>
        ${selectField('Estado', 'sales-filter', [['all', 'Todos'], ...Object.entries(statusNames)], filter)}
        ${salesButton('Actualizar', 'reload')}${visible.length ? salesButton('Exportar PDF', 'report') : ''}</div>
        <div class="sales-list">${visible.length ? visible.map(sale => saleCard(sale, trips, openPlans.has(sale.id), today)).join('') : '<section class="card empty">No hay coros en esta lista.</section>'}</div>`;
    }

    async function load() {
      page.innerHTML = pageTitle('COMERCIAL', 'Ventas', 'Coros, cuotas y pagos.') + '<div class="card" role="status">Cargando ventas…</div>';
      try {
        records = await CoralCloud.listSales();
        paint();
      } catch (error) {
        if (page.isConnected) page.innerHTML = pageTitle('COMERCIAL', 'Ventas', 'Coros, cuotas y pagos.') +
          `<div class="card"><p role="alert">${esc(error.message)}</p>${salesButton('Volver a intentar', 'reload')}</div>`;
      }
    }

    async function save(sale, revision) {
      CoralSales.validateSale(sale);
      const saved = await CoralCloud.saveSale(sale, revision);
      dashboardRequest = undefined;
      records = records.filter(record => record.sale.id !== saved.sale.id).concat(saved);
      paint();
    }

    function showForm(title, fields, saveLabel, onSubmit) {
      modal(title, `<form id="sales-form"><div class="form-grid">${fields}</div>
        <p class="sales-error" role="alert"></p><div class="modal-actions">${button('Cancelar', 'close')}
        <button class="primary" type="submit">${saveLabel}</button></div></form>`);
      const form = $('#sales-form');
      form.onsubmit = async event => {
        event.preventDefault();
        const submit = form.querySelector('button[type=submit]');
        if (submit.disabled) return;
        submit.disabled = true;
        const errorText = form.querySelector('.sales-error');
        errorText.textContent = '';
        try {
          await onSubmit(Object.fromEntries(new FormData(form)));
          if (form.isConnected && $('#modal').open) closeModal();
          notify('Guardado en Ventas.');
        } catch (error) {
          errorText.textContent = error.message;
          if (!form.isConnected || !$('#modal').open) notify(error.message);
        } finally {
          submit.disabled = false;
        }
      };
    }

    function editSale(record) {
      const sale = record ? structuredClone(record.sale) : CoralSales.blankSale();
      const tripOptions = [['', 'Sin salida vinculada'], ...trips.map(trip => [trip.id, trip.name])];
      if (sale.tripId && !trips.some(trip => trip.id === sale.tripId)) tripOptions.push([sale.tripId, 'Salida vinculada no disponible']);
      const fields = field('Nombre del coro', 'name', sale.name, 'text', 'required maxlength="120"') +
        field('Representante', 'representative', sale.representative, 'text', 'maxlength="120"') +
        field('WhatsApp', 'whatsapp', sale.whatsapp, 'tel', 'maxlength="40" autocomplete="tel"') +
        field('Correo', 'email', sale.email, 'email', 'maxlength="254" autocomplete="email"') +
        selectField('Estado', 'status', Object.entries(statusNames), sale.status) +
        selectField('Salida vinculada', 'tripId', tripOptions, sale.tripId) +
        field('Cantidad de personas', 'people', sale.people || '', 'number', 'min="0" step="1"') +
        selectField('Moneda', 'currency', currencies, sale.currency) +
        amountInput('Importe acordado', 'total', sale.totalCents, false) + colorPicker(sale) +
        `<label class="field span2">Notas de seguimiento<textarea name="notes" rows="3" maxlength="2000">${esc(sale.notes)}</textarea></label>`;
      showForm(record ? 'Editar coro' : 'Nuevo coro', fields, 'Guardar coro', async ({total, people, ...values}) => {
        const changes = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]));
        if (sale.installments.length && changes.currency !== sale.currency) throw Error('Conservá la moneda del plan de cuotas registrado.');
        await save({...sale, ...changes, totalCents: CoralSales.parseAmount(total.trim() || '0'), people: Number(people)}, record?.revision ?? 0);
      });
    }

    function editInstallment(record, original) {
      const sale = structuredClone(record.sale);
      const installment = original ? sale.installments.find(item => item.id === original.id) : {id: Coral.uid(), payments: []};
      const fields = field('Vencimiento', 'dueDate', installment.dueDate || '', 'date', 'required') +
        amountInput('Importe de la cuota', 'amount', installment.amountCents);
      showForm(original ? 'Editar cuota' : 'Agregar cuota', fields, 'Guardar cuota', async values => {
        installment.dueDate = values.dueDate;
        installment.amountCents = CoralSales.parseAmount(values.amount);
        if (!original && !sale.installments.includes(installment)) sale.installments.push(installment);
        await save(sale, record.revision);
      });
    }

    function addPayment(record, original) {
      const today = CoralSales.today();
      const balance = CoralSales.installmentStatus(original, today).balanceCents;
      const fields = field('Fecha de pago', 'date', today, 'date', `required max="${today}"`) +
        amountInput('Importe recibido', 'amount', balance) +
        selectField('Medio de pago', 'method', paymentMethods, 'Transferencia') +
        field('Referencia o nota', 'note', '', 'text', 'maxlength="300"');
      showForm('Registrar pago', fields, 'Guardar pago', async values => {
        const sale = structuredClone(record.sale);
        const installment = sale.installments.find(item => item.id === original.id);
        installment.payments.push({id: Coral.uid(), date: values.date, amountCents: CoralSales.parseAmount(values.amount), method: values.method, note: values.note.trim()});
        await save(sale, record.revision);
      });
    }

    function removePayment(record, installmentId, paymentId) {
      confirmAction('Quitar pago', 'El pago se quitará del registro y se recalculará el saldo de la cuota.', async () => {
        const sale = structuredClone(record.sale);
        const installment = sale.installments.find(item => item.id === installmentId);
        installment.payments = installment.payments.filter(payment => payment.id !== paymentId);
        try {
          await save(sale, record.revision);
          notify('Pago quitado.');
        } catch (error) {
          notify(error.message);
        }
      });
    }

    page.addEventListener('click', event => {
      const control = event.target.closest('[data-sales-action]');
      if (!control) return;
      const {salesAction, sale, installment, payment} = control.dataset;
      if (salesAction === 'reload') return load();
      if (salesAction === 'report') return CoralSalesReport.print(visibleSales(), {filter, trips});
      if (salesAction === 'new') return editSale();
      const record = records.find(item => item.sale.id === sale);
      if (!record) return;
      if (salesAction === 'edit') return editSale(record);
      if (salesAction === 'new-installment') return editInstallment(record);
      const entry = record.sale.installments.find(item => item.id === installment);
      if (!entry) return;
      if (salesAction === 'edit-installment') return editInstallment(record, entry);
      if (salesAction === 'pay') return addPayment(record, entry);
      if (salesAction === 'remove-payment') return removePayment(record, entry.id, payment);
    });
    page.addEventListener('change', event => {
      if (event.target.name !== 'sales-filter') return;
      filter = event.target.value;
      paint();
      page.querySelector('[name="sales-filter"]').focus();
    });
    return load();
  }

  window.CoralSalesUI = {render, renderDashboard};
})();
