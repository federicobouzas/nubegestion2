<link href="https://fonts.googleapis.com/css?family=Nunito" rel="stylesheet">
<div class="row">
    <div class="offset-4 col-md-4">
        <div class="card mt30">
            <div class="card-header">
                <h5 class="card-title mb0">Pago Rechazado</h5>
            </div>
            <div class="card-body text-center">
                <h3><i class="fas fa fa-exclamation-circle fa-3x text-danger"></i></h3>
                <h5>El pago no ha sido procesado.</h5> 
                <p>
                    <?php if ($payment["response"]["status_detail"] == "cc_rejected_bad_filled_card_number"): ?>
                        Revisa el número de tarjeta.
                    <?php elseif ($payment["response"]["status_detail"] == "cc_rejected_bad_filled_date"): ?>
                        Revisa la fecha de vencimiento.
                    <?php elseif ($payment["response"]["status_detail"] == "cc_rejected_bad_filled_other"): ?>
                        Revisa los datos.
                    <?php elseif ($payment["response"]["status_detail"] == "cc_rejected_bad_filled_security_code"): ?>
                        Revisa el código de seguridad.
                    <?php elseif ($payment["response"]["status_detail"] == "cc_rejected_blacklist"): ?>
                        No pudimos procesar tu pago.   
                    <?php elseif ($payment["response"]["status_detail"] == "cc_rejected_call_for_authorize"): ?>
                        Debes autorizar ante <strong><?php echo $payment["response"]["payment_method_id"]; ?></strong> 
                        el pago de <strong>$<?php echo $payment["response"]["transaction_amount"]; ?></strong> a MercadoPago.
                    <?php elseif ($payment["response"]["status_detail"] == "cc_rejected_card_disabled"): ?>
                        Llama a <strong><?php echo $payment["response"]["payment_method_id"]; ?></strong> para que active tu tarjeta.<br/>
                        El teléfono está al dorso de tu tarjeta.
                    <?php elseif ($payment["response"]["status_detail"] == "cc_rejected_card_error"): ?>
                        No pudimos procesar tu pago.
                    <?php elseif ($payment["response"]["status_detail"] == "cc_rejected_duplicated_payment"): ?>
                        Ya hiciste un pago por ese valor.<br/>
                        Si necesitas volver a pagar usa otra tarjeta u otro medio de pago.
                    <?php elseif ($payment["response"]["status_detail"] == "cc_rejected_high_risk"): ?>
                        Tu pago fue rechazado.<br/>
                        Elige otro de los medios de pago, te recomendamos con medios en efectivo.
                    <?php elseif ($payment["response"]["status_detail"] == "cc_rejected_insufficient_amount"): ?>
                        Tu <strong><?php echo $payment["response"]["payment_method_id"]; ?></strong> no tiene fondos suficientes.
                    <?php elseif ($payment["response"]["status_detail"] == "cc_rejected_invalid_installments"): ?>
                        <strong><?php echo ucfirst($payment["response"]["payment_method_id"]); ?></strong> no procesa pagos en <strong><?php echo $payment["response"]["installments"]; ?></strong> cuotas.
                    <?php elseif ($payment["response"]["status_detail"] == "cc_rejected_max_attempts"): ?>
                        Llegaste al límite de intentos permitidos.<br/>
                        Elige otra tarjeta u otro medio de pago.
                    <?php elseif ($payment["response"]["status_detail"] == "cc_rejected_other_reason"): ?>
                        <strong><?php echo ucfirst($payment["response"]["payment_method_id"]); ?></strong> no procesó el pago.
                    <?php endif; ?>
                </p>
            </div>
        </div>
    </div>
    <div class="offset-4 col-md-4 mt25 text-center">
        <a href="<?php echo WWW; ?>" class="btn btn-outline-secondary">
            <i class="fa fa-home"></i> Volver al Inicio
        </a>
    </div>
</div>

