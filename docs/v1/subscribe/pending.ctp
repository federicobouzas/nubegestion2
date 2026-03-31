<link href="https://fonts.googleapis.com/css?family=Nunito" rel="stylesheet">
<div class="row">
    <div class="offset-4 col-md-4">
        <div class="card mt30">
            <div class="card-header">
                <h5 class="card-title mb0">Pago Pendiente</h5>
            </div>
            <div class="card-body text-center">
                <h3><i class="fas fa fa-check-circle fa-3x text-warning"></i></h3>
                <h5>Solo falta que pagues la factura.</h5> 
                <p>
                    Imprime <strong><a href="<?php echo $payment["response"]["transaction_details"]["external_resource_url"]; ?>" target="_blank">esta factura</a></strong> 
                    factura para abonarla en el local <?php echo $payment["response"]["payment_method_id"]; ?> más cercano.
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

