<h3><strong>Seleccione el plan deseado</strong></h3> 
<div class="mt25 row">
    <div class="offset-2 col-8">
        <select class="form-control form-control-lg text-center" id="plan" style="width: 100%;">
            <?php foreach($planes as $plan => $precio): ?>
                <option value="<?php echo $plan; ?>" selected="<?php echo isset($ultimo_pago) && $ultimo_pago == $plan; ?>"><?php echo Inflector::humanize($plan); ?> ($ <?php echo $precio; ?>)</option>
            <?php endforeach; ?>
        </select>
    </div>
    <div class="pull-left mt10">
        <a href="https://www.nubegestion.com.ar/#precios" target="_blank">
            <i class="fa fa-info-circle fa-2x"></i>
        </a>
    </div>
</div>