"""Reglas de presentación compartidas (manual I5 v2.6, sección 7, paso 8). No cambian ningún dato."""


def etiqueta_nivel(nivel, motivo):
    """El CSV marca «alto» también cuando el único motivo es la calidad del dato satelital (AGC_065).
    La calidad del dato no es riesgo de crédito: se muestra como «revisar dato antes de decidir»."""
    return "revisar dato antes de decidir" if motivo == "dato satelital a revisar" else nivel
