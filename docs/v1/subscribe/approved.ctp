<link href="https://fonts.googleapis.com/css?family=Nunito" rel="stylesheet">
<div class="row">
    <div class="offset-4 col-md-4">
        <div class="card mt30">
            <div class="card-header">
                <h5 class="card-title mb0">Pago Acreditado</h5>
            </div>
            <div class="card-body text-center">
                <h3><i class="fas fa fa-check-circle fa-3x text-success"></i></h3>
                <h5>¡Listo, se acreditó tu pago!</h5> 
                <p>
                    En tu resumen verás el cargo de 
                    <strong>$<?php echo $payment["response"]["transaction_amount"]; ?> </strong>
                    como <strong><?php echo $payment["response"]["statement_descriptor"]; ?></strong>.
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

