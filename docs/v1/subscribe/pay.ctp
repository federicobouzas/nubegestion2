<script src="https://secure.mlstatic.com/sdk/javascript/v1/mercadopago.js"></script>
<script src="<?php echo WWW; ?>js/mercadopago.js"></script>
<ul class="nav nav-tabs mt15" id="myTab" role="tablist">
    <li class="nav-item">
        <a class="nav-link active" id="card-tab" data-toggle="tab" href="#card" role="tab" aria-controls="card" aria-selected="true">Tarjeta de Crédito</a>
    </li>
    <!--
    <li class="nav-item">
        <a class="nav-link" id="other-tab" data-toggle="tab" href="#transfer" role="tab" aria-controls="transfer" aria-selected="false">Transferencia</a>
    </li>
    -->
    <li class="nav-item">
        <a class="nav-link" id="other-tab" data-toggle="tab" href="#other" role="tab" aria-controls="other" aria-selected="false">Otros Medios</a>
    </li>
</ul>
<div class="tab-content" id="myTabContent">
    <div class="tab-pane fade show active mt15" id="card" role="tabpanel" aria-labelledby="card-tab">
        <div class="card">
            <div class="card-header">
                <h5 class="card-title mb0">
                    Detalle del Pago
                    <img class="pull-right" src="<?php echo WWW; ?>img/accepted_c22e0.png">
                </h5>
            </div>
            <div class="card-body">
                <form role="form" id="pay" name="pay" method="POST" action="<?php echo WWW; ?>checkout">
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label for="cardNumber">NÚMERO DE TARJETA</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="cardNumber" data-checkout="cardNumber" placeholder="" />
                                <div class="input-group-append">
                                    <div class="input-group-text"><i class="fa fa-credit-card"></i></div>
                                </div>
                            </div>
                        </div>  
                    </div>
                    <div class="form-row">
                        <div class="form-group col-9">
                            <label for="cardExpiry"><span class="hidden-xs">VENCIMIENTO</span></label>
                            <div>
                                <select class="form-control float-left" id="cardExpirationMonth" data-checkout="cardExpirationMonth">
                                    <option value="" />
                                    <option value="01">01</option>
                                    <option value="02">02</option>
                                    <option value="03">03</option>
                                    <option value="04">04</option>
                                    <option value="05">05</option>
                                    <option value="06">06</option>
                                    <option value="07">07</option>
                                    <option value="08">08</option>
                                    <option value="09">09</option>
                                    <option value="10">10</option>
                                    <option value="11">11</option>
                                    <option value="12">12</option>
                                </select>
                                <select class="form-control float-left ml15" id="cardExpirationYear" data-checkout="cardExpirationYear">
                                    <option value="" />
                                    <?php for ($anio = date("Y"); $anio <= 2050; $anio++): ?>
                                        <option value="<?php echo $anio; ?>"><?php echo $anio; ?></option>
                                    <?php endfor; ?>
                                </select>
                            </div>
                        </div>
                        <div class="col-3 pull-right">
                            <div class="form-group">
                                <label for="cardCVC">CVV</label>
                                <input type="text" class="form-control" id="securityCode" data-checkout="securityCode" placeholder="" />
                            </div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label for="couponCode">NOMBRE EN TARJETA</label>
                            <input type="text" class="form-control" id="cardholderName" data-checkout="cardholderName" placeholder="" />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label for="docNumber">DOCUMENTO</label>
                            <div class="row">
                                <div class="col-3">
                                    <select class="form-control float-left" id="docType" data-checkout="docType"></select>
                                </div>
                                <div class="col-9">
                                    <input type="text" class="form-control float-left" id="docNumber" data-checkout="docNumber" placeholder="" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <!--
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label for="issuers">EMISORES</label>
                            <div class="row">
                                <div class="col-7">
                            <select class="form-control" id="issuers" data-checkout="issuers"></select>            
                                </div>
                                <div class="col-5 issuersImg">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-12">
                            <label for="installments">CUOTAS</label>
                            <select class="form-control" id="installments" data-checkout="installments"></select>            
                        </div>
                    </div>
                    -->
                    <div class="form-row">
                        <div class="col-12">
                            <button class="btn btn-success btn-lg btn-block" type="button" onclick="doPay('pay');">Realizar Pago</button>
                        </div>
                    </div>
                </form>
            </div>
        </div> 
    </div>
    <div class="tab-pane fade" id="transfer" role="tabpanel" aria-labelledby="transfer-tab">
    </div>
    <div class="tab-pane fade" id="other" role="tabpanel" aria-labelledby="other-tab">
        <div class="card boton-otro-medio pagofacil" onclick="doPay('pay2');">
            <form role="form" id="pay2" name="pay" method="POST" action="<?php echo WWW; ?>checkout">
                <input type="hidden" name="paymentMethodId" value="pagofacil" />
                <img src="<?php echo WWW; ?>img/pagofacil.png" />
            </form>
        </div>
        <div class="card boton-otro-medio rapipago" onclick="doPay('pay3');">
            <form role="form" id="pay3" name="pay" method="POST" action="<?php echo WWW; ?>checkout">
                <input type="hidden" name="paymentMethodId" value="rapipago" />
                <img src="<?php echo WWW; ?>img/rapipago.png" />
            </form>
        </div>
        <div class="card boton-otro-medio redlink" onclick="doPay('pay4');">
            <form role="form" id="pay4" name="pay" method="POST" action="<?php echo WWW; ?>checkout">
                <input type="hidden" name="paymentMethodId" value="redlink" />
                <img src="<?php echo WWW; ?>img/redlink.png" />
            </form>
        </div>
    </div>
</div>
<div class="loadingPago">
    <i class="fa fa-circle-notch fa-pulse"></i>
    <h1 class="mt10">Procesando pago ...</h1>
</div>