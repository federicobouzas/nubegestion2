<link href="https://fonts.googleapis.com/css?family=Nunito" rel="stylesheet">
<div class="row">
    <div class="offset-4 col-md-4">
        <div class="card mt30">
            <div class="card-header">
                <h5 class="card-title mb0">Pago en Proceeso</h5>
            </div>
            <div class="card-body text-center">
                <h3><i class="fas fa fa-check-circle fa-3x text-warning"></i></h3>
                <h5>Estamos procesando el pago.</h5> 
                <p>
                    <?php if ($payment["response"]["status_detail"] == "pending_contingency"): ?>
                        En menos de una hora te enviaremos por e-mail el resultado.
                    <?php elseif ($payment["response"]["status_detail"] == "pending_review_manual"): ?>
                        En menos de 2 días hábiles te diremos por e-mail si se acreditó o si necesitamos más información.
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

