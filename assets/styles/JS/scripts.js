$(document).ready(function () {
    // ==========================================
    // 1. CONFIGURACIÓN Y CONTROL DE SALDO GLOBAL
    // ==========================================
    if (!localStorage.getItem("saldoBilletera")) {
        localStorage.setItem("saldoBilletera", 450000);
    }
    
    function actualizarSaldoVisual() {
        const saldoActual = parseFloat(localStorage.getItem("saldoBilletera"));
        const saldoFormateado = `$${saldoActual.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        $(".balance-amount, #wallet-total").text(saldoFormateado);
    }
    actualizarSaldoVisual();

    // ==========================================
    // 2. LOGIN (Index.html)
    // ==========================================
    const CORREO_VALIDO = "billetera@alke.cl";
    const CLAVE_VALIDA = "987654";

    $("#email").attr("title", `Sugerencia: ${CORREO_VALIDO}`);
    $("#password").attr("title", `Sugerencia: ${CLAVE_VALIDA}`);

    $("form").on("submit", function (e) {
        if (this.id === "add-contact-form" || this.id === "load-funds-form" || $(this).attr("action") === "/send-transfer") return;
        e.preventDefault();
        
        const email = $("#email").val().trim();
        const password = $("#password").val();

        if (email === CORREO_VALIDO && password === CLAVE_VALIDA) {
            window.location.href = "menuPrincipal.html";
        } else {
            alert("Credenciales inválidas. Por favor intenta de nuevo.");
        }
    });

    // ==========================================
    // 3. BARRA DE NAVEGACIÓN INTELIGENTE
    // ==========================================
    $(".nav-button").on("click", function (e) {
        const texto = $(this).text().toLowerCase().trim();
        if (texto.includes("panel")) window.location.href = "menu.html";
        else if (texto.includes("transferir")) window.location.href = "sendmoney.html";
        else if (texto.includes("contactos")) window.location.href = "contactos.html";
        else if (texto.includes("ingresar") || texto.includes("depositar")) window.location.href = "deposit.html";
        else if (texto.includes("cerrar sesión")) window.location.href = "Index.html";
    });

    // ==========================================
    // 4. AGREGAR NUEVO CONTACTO (agregarContacto.html)
    // ==========================================
    $("#add-contact-form").on("submit", function (e) {
        e.preventDefault();

        const nuevoContacto = {
            id: Date.now(),
            nombre: $("#contact-name").val(),
            rut: $("#contact-rut").val(),
            banco: $("#contact-bank").val(),
            tipoCuenta: $("#contact-account-type").val(),
            numCuenta: $("#contact-account-number").val(),
            email: $("#contact-email").val()
        };

        let listaContactos = JSON.parse(localStorage.getItem("misContactos")) || [];
        listaContactos.push(nuevoContacto);
        localStorage.setItem("misContactos", JSON.stringify(listaContactos));

        this.reset();
        $("#toast").text("¡Contacto guardado con éxito!").css("opacity", "1");

        setTimeout(() => {
            $("#toast").css("opacity", "0");
            window.location.href = "contactos.html";
        }, 1500);
    });

    // ==========================================
    // 5. RENDERIZAR TABLA DE CONTACTOS (contactos.html)
    // ==========================================
    const $tbodyContactos = $("#contacts-body");
    if ($tbodyContactos.length) {
        const listaContactos = JSON.parse(localStorage.getItem("misContactos")) || [];
        listaContactos.forEach(contacto => {
            $tbodyContactos.append(`
                <tr>
                    <td>
                        <div class="contact-name-block">
                            <strong>${contacto.nombre}</strong>
                            <span class="contact-alias">${contacto.rut}</span>
                        </div>
                    </td>
                    <td><span class="bank-badge">${contacto.banco}</span></td>
                    <td><span class="account-number">${contacto.tipoCuenta}</span></td>
                    <td><span class="account-number">${contacto.numCuenta}</span></td>
                    <td><span class="bank-badge">${contacto.email}</span></td>
                    <td style="text-align: center;"><button class="btn-edit btn-transfer-trigger">Transferir</button></td>
                </tr>
            `);
        });

        $(document).on("click", ".btn-transfer-trigger", function() {
            window.location.href = "sendmoney.html";
        });
    }

    // ==========================================
    // 6. PANTALLA TRANSFERENCIAS (sendmoney.html)
    // ==========================================
    const $contactsList = $(".contacts-list");
    const $selectContact = $("#select-contact");

    if ($contactsList.length && $selectContact.length) {
        const contactosBase = [
            { id: "1", nombre: "Juan Pérez", detalle: "Cuenta Corriente - Alke Bank" },
            { id: "2", nombre: "María Rodríguez", detalle: "Cuenta Vista/Rut - FinTech Bank" },
            { id: "3", nombre: "Carlos Gómez", detalle: "Cuenta Corriente - Banco de Chile" }
        ];
        const contactosNuevos = JSON.parse(localStorage.getItem("misContactos")) || [];
        const agendaCompleta = [
            ...contactosBase,
            ...contactosNuevos.map(c => ({ id: c.id.toString(), nombre: c.nombre, detalle: `${c.tipoCuenta} - ${c.banco}` }))
        ];

        $contactsList.empty();
        $selectContact.html('<option value="" disabled selected>Selecciona un contacto...</option>');

        agendaCompleta.forEach(c => {
            $selectContact.append(`<option value="${c.id}">${c.nombre}</option>`);
            $contactsList.append(`
                <div class="contact-item d-flex justify-content-between align-items-center派">
                    <div class="contact-info">
                        <div class="contact-name">${c.nombre}</div>
                        <div class="contact-detail">${c.detail || c.detalle}</div>
                    </div>
                    <button type="button" class="btn-select-contact" data-id="${c.id}">Transferir</button>
                </div>
            `);
        });

        $(document).on("click", ".btn-select-contact", function () {
            $selectContact.val($(this).data("id"));
            $("input[type='number']").focus();
        });
    }

    // Lógica del Formulario de Transferencia
    $('form[action="/send-transfer"]').on("submit", function (e) {
        e.preventDefault();
        const monto = parseFloat($(this).find("input[type='number']").val());
        const saldoActual = parseFloat(localStorage.getItem("saldoBilletera"));

        if (!$("#select-contact").val()) return alert("Selecciona un destinatario.");
        if (isNaN(monto) || monto <= 0) return alert("Ingresa un monto válido.");
        if (monto > saldoActual) return alert("Fondos insuficientes.");

        localStorage.setItem("saldoBilletera", saldoActual - monto);
        this.reset();
        
        $("#toast").text("¡Transferencia realizada con éxito!").css("opacity", "1");
        setTimeout(() => { window.location.href = "menuPrincipal.html"; }, 2000);
    });

    // ==========================================
    // 7. CARGAR FONDOS (ingresarDebito.html)
    // ==========================================
    $("#load-funds-form").on("submit", function (e) {
        e.preventDefault();
        const montoCarga = parseFloat($("#amount").val());
        if (isNaN(montoCarga) || montoCarga <= 0) return alert("Monto inválido.");

        const saldoActual = parseFloat(localStorage.getItem("saldoBilletera")) || 450000;
        localStorage.setItem("saldoBilletera", saldoActual + montoCarga);

        actualizarSaldoVisual();
        this.reset();

        $("#toast").text("¡Fondos cargados exitosamente!").css("opacity", "1");
        setTimeout(() => { $("#toast").css("opacity", "0"); }, 2000);
    });
});

// Funciones globales de utilidad para deposit.html
function copiarDatos() {
    navigator.clipboard.writeText($("#account-data").text()).then(() => {
        alert("¡Datos copiados!");
    });

}
// Control de clic dinámico opcional para transiciones en el botón de agregar saldo
    $(".btn-add-balance").on("click", function(e) {
        // Permite que el enlace funcione con normalidad hacia deposit.html
        // Aquí puedes añadir animaciones de salida o analíticas si lo requieres en el futuro
    });