<?php if (isset($prueba_servicio_vencido) && $prueba_servicio_vencido): ?>
    <div class="col-12 warning text-center prueba">
        Tu período de prueba finaliza 
        <?php echo ($dias_restantes_prueba == 0 ? "<strong>hoy</strong>" : "en <strong>" . $dias_restantes_prueba . "</strong> día" . ($dias_restantes_prueba == 1 ? "" : "s")); ?>.
        Confirmá tu suscripción <strong><a href="<?php echo WWW; ?>subscribe">acá</a></strong>.
    </div>
<?php endif; ?>
<?php if (isset($pago_servicio_vencido) && $pago_servicio_vencido): ?>
    <div class="col-12 danger text-center prueba">
        El pago de tu servicio se encuentra vencido  
        <?php echo ($dias_vencidos_pago == 0 ? "a partir de <strong>hoy</strong>" : "desde hace <strong>" . $dias_vencidos_pago . "</strong> día" . ($dias_vencidos_pago == 1 ? "" : "s")); ?>.
        Regularizalo haciendo el pago <strong><a href="<?php echo WWW; ?>subscribe">acá</a></strong>.
    </div>
<?php endif; ?>