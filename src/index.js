import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../dist/public/css/main.css';
import Swal from 'sweetalert2';

let btn_resolver = document.getElementById("btn_resolver");
let operacion = document.getElementById("operacion");
let resultado = document.getElementById("resultado");
let btn_limpiar = document.getElementById("btn_limpiar");
let historialDiv = document.getElementById("historial");
let operacionesDiv = document.getElementById("operaciones");
let selectTipo = document.querySelector("select");

const regexSubExp = /\([^()]+\)/g;
let historial = [];

const validarOperacion = (valor) => {
    if (valor.trim() === "") {
        Swal.fire({
            icon: "warning",
            title: "Campo vacío",
            text: "Por favor ingresa una operación.",
            background: "#a42525b5",
            color: "#000000"
        });
        return false;
    }

    const regexValidos = /^[0-9+\-*/^().\s]+$/;
    if (!regexValidos.test(valor)) {
        Swal.fire({
            icon: "error",
            title: "Caracteres inválidos",
            text: "Solo se permiten números, operadores y paréntesis.",
            background: "#a42525b5",
            color: "#000000"
        });
        return false;
    }

    let balance = 0;
    for (let char of valor) {
        if (char === "(") balance++;
        else if (char === ")") balance--;
        if (balance < 0) {
            Swal.fire({
                icon: "error",
                title: "Paréntesis mal colocados",
                text: "Revisa la posición de tus paréntesis.",
                background: "#a42525b5",
                color: "#000000"
            });
            return false;
        }
    }
    if (balance !== 0) {
        Swal.fire({
            icon: "error",
            title: "Paréntesis incompletos",
            text: "Faltan paréntesis de apertura o cierre.",
            background: "#a42525b5",
            color: "#000000"
        });
        return false;
    }

    const regexOperadoresInvalidos = /[+\-*/^]{2,}/;
    if (regexOperadoresInvalidos.test(valor)) {
        Swal.fire({
            icon: "error",
            title: "Operadores consecutivos",
            text: "No se permiten operadores repetidos seguidos, como ++ o **.",
            background: "#a42525b5",
            color: "#000000"
        });
        return false;
    }

    const regexInicioFin = /^[*/^]|[+\-*/^]$/;
    if (regexInicioFin.test(valor)) {
        Swal.fire({
            icon: "error",
            title: "Operación inválida",
            text: "No puede empezar o terminar con un operador.",
            background: "#a42525b5",
            color: "#000000"
        });
        return false;
    }

    return true;
}

btn_resolver.addEventListener("click", () => {
    let valor_operacion = operacion.value.trim();

    if (!validarOperacion(valor_operacion)) return;

    historial.push(valor_operacion);
    actualizarHistorial();

    valor_operacion = valor_operacion.replace(/\s+/g, "");
    let tipo = selectTipo.value;

    let temporales = [];
    let contador = 1;

    let subexp;
    while ((subexp = valor_operacion.match(regexSubExp))) {
        subexp.forEach(exp => {
            const contenido = exp.replace(/[()]/g, "");
            const temporal = `t${contador++}`;
            temporales.push({ t: temporal, exp: contenido });
            valor_operacion = valor_operacion.replace(exp, temporal);
        });
    }

    const operadoresJerarquia = [
        { reg: /([t\d\w]+)\^([t\d\w]+)/, op: "^" },
        { reg: /([t\d\w]+)\*([t\d\w]+)/, op: "*" },
        { reg: /([t\d\w]+)\/([t\d\w]+)/, op: "/" },
        { reg: /([t\d\w]+)\+([t\d\w]+)/, op: "+" },
        { reg: /([t\d\w]+)\-([t\d\w]+)/, op: "-" }
    ];

    let huboCambio = true;
    while (huboCambio) {
        huboCambio = false;
        for (let { reg, op } of operadoresJerarquia) {
            let match = valor_operacion.match(reg);
            if (match) {
                let [, op1, op2] = match;
                let temporal = `t${contador++}`;
                temporales.push({ t: temporal, op, op1, op2 });
                valor_operacion = valor_operacion.replace(match[0], temporal);
                huboCambio = true;
                break;
            }
        }
    }

    temporales.push({ t: "z", exp: valor_operacion });

    let salida = "";

    if (tipo === "triplos" || tipo === "ambas") {
        salida += "<b>Triplos:</b><br>";
        temporales.forEach(linea => {
            if (linea.op) {
                salida += `(${linea.op}, ${linea.op1 || "-"}, ${linea.op2 || "-"}, ${linea.t})<br>`;
            } else {
                salida += `(=, ${linea.exp}, -, ${linea.t})<br>`;
            }
        });
        salida += "<br>";
    }

    if (tipo === "cuadruplos" || tipo === "ambas") {
        salida += "<b>Cuádruplos:</b><br>";
        temporales.forEach(linea => {
            if (linea.op) {
                salida += `${linea.t} = ${linea.op1} ${linea.op} ${linea.op2}<br>`;
            } else {
                salida += `${linea.t} = ${linea.exp}<br>`;
            }
        });
    }

    operacionesDiv.innerHTML = salida;

    try {
        let valorNumerico = eval(operacion.value);
        resultado.value = valorNumerico;
    } catch (e) {
        Swal.fire({
            icon: "error",
            title: "Error al calcular",
            text: "Verifica la sintaxis de la operación.",
            background: "#a42525b5",
            color: "#000000"
        });
        resultado.value = "";
    }
});

btn_limpiar.addEventListener("click", () => {
    operacion.value = "";
    operacionesDiv.innerHTML = "";
    resultado.value = "";
    Swal.fire({
        icon: "info",
        title: "Limpieza completada",
        text: "Se ha vaciado el historial y los resultados.",
        background: "#f2f25eb5",
        color: "#000000"
    });
});

const actualizarHistorial = () => {
    historialDiv.innerHTML = historial.map((op, i) => `${i + 1}. ${op}`).join("<br>");
}
