var planes;

$(function () {
    var dev = CONFIG.debug;
    planes = CONFIG.site.planes;

    Mercadopago.setPublishableKey(CONFIG.site.mercadopago.public_key);
    Mercadopago.getIdentificationTypes();
    $("#cardNumber").bind("change keyup", guessingPaymentMethod);
    //$("#issuers").bind("change", getInstallments);

    if (dev) {
        $("#cardNumber").val("4509 9535 6623 3704").change();
        $("#securityCode").val("123");
        $("#cardExpirationMonth").val("02");
        $("#cardExpirationYear").val("2020");
        $("#cardholderName").val("AAA BBB");
        $("#docNumber").val("1235678");
    }
});

function addEvent(el, eventName, handler) {
    if (el.addEventListener) {
        el.addEventListener(eventName, handler);
    } else {
        el.attachEvent('on' + eventName, function () {
            handler.call(el);
        });
    }
}

function getBin() {
    var ccNumber = document.querySelector('input[data-checkout="cardNumber"]');
    return ccNumber.value.replace(/[ .-]/g, '').slice(0, 6);
}

function guessingPaymentMethod(event) {
    $("#cardNumber").siblings("img").remove();
    var bin = getBin();
    if (bin.length >= 6) {
        Mercadopago.getPaymentMethod({"bin": bin}, setPaymentMethodInfo);
    }
}

function setPaymentMethodInfo(status, response) {
    if (status == 200) {
        getIssuers(response[0].id);
        $("#cardNumber").after('<img class="credit-card" src="' + response[0].secure_thumbnail + '" />');
        if ($("#pay input[name=paymentMethodId]").length == 0) {
            var paymentMethodInput = $("<input />")
                    .attr("name", "paymentMethodId")
                    .attr("type", "hidden")
                    .attr("value", response[0].id);
            $("#pay").append(paymentMethodInput);
        } else {
            $("#pay input[name=paymentMethodId]").val(response[0].id);
        }
    }
}

function getIssuers(cardId) {
    Mercadopago.getIssuers(cardId, function (status, response) {
        if (status == 200) {
            $("#issuers").append('<option value="" />');
            for (var i in response) {
                $("#issuers").append('<option data-thumbnail="' + response[i].secure_thumbnail + '" value="' + response[i].id + '">' + response[i].name + '</option>');
            }
        }
    });
}

function doPay(formId) {
    loadingPagoStart();
    var $form = document.querySelector('#' + formId);
    $('<input name="plan" type="hidden" />').val($("#plan").val()).appendTo($form);
    $(".is-invalid").removeClass("is-invalid");
    if (formId == "pay") {
        Mercadopago.createToken($form, sdkResponseHandler);
    } else {
        $form.submit();
    }
}

function sdkResponseHandler(status, response) {
    if (status != 200 && status != 201) {
        if (response.error == "bad_request" && response.cause.length > 0) {
            var errors = [];
            for (var i in response.cause) {
                switch (response.cause[i].code) {
                    case "205":
                        $("#cardNumber").addClass("is-invalid");
                        errors = addError("Ingresa el número de tu tarjeta.", errors);
                        break;
                    case "E301":
                        $("#cardNumber").addClass("is-invalid");
                        errors = addError("Hay algo mal en ese número. Vuelve a ingresarlo.", errors);
                        break;
                    case "208":
                        $("#cardExpirationMonth").addClass("is-invalid");
                        errors = addError("Elige un mes.", errors);
                        break;
                    case "325":
                        $("#cardExpirationMonth").addClass("is-invalid");
                        errors = addError("Revisa la fecha.", errors);
                        break;
                    case "209":
                        $("#cardExpirationYear").addClass("is-invalid");
                        errors = addError("Elige un año.", errors);
                        break;
                    case "326":
                        $("#cardExpirationYear").addClass("is-invalid");
                        errors = addError("Revisa la fecha.", errors);
                        break;
                    case "E302":
                        $("#securityCode").addClass("is-invalid");
                        errors = addError("Revisa el código de seguridad.", errors);
                        break;
                    case "221":
                        $("#cardholderName").addClass("is-invalid");
                        errors = addError("Ingresa el nombre y apellido.", errors);
                        break;
                    case "213":
                    case "214":
                        $("#docNumber").addClass("is-invalid");
                        errors = addError("Ingresa tu documento.", errors);
                        break;
                }
            }
            displayErrors(errors);
        }
    } else {
        var tokenInput = $("<input />").attr("name", "token").attr("type", "hidden").attr("value", response.id);
        $("#pay").append(tokenInput).submit();
    }
}

function addError(error, errors) {
    if ($.inArray(error, errors) === -1) {
        errors.push(error);
    }
    return errors;
}

function displayErrors(errors) {
    if (errors.length > 0) {
        var html = '';
        html += '<div class="modal fade error-modal" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">';
        html += '<div class="modal-dialog" role="document">';
        html += '<div class="modal-content">';
        html += '<div class="modal-header">';
        html += '<i class="fa fa-times-circle fa-2x pull-left error-color"></i>';
        html += '<h5 class="error-color pl10 pt2">Por favor verifique los siguientes errores:</h5>';
        html += '<button type="button" class="close" data-dismiss="modal" aria-label="Close">';
        html += '<span aria-hidden="true">&times;</span>';
        html += '</button>';
        html += '</div>';
        html += '<div class="modal-body"><ul><li class="mt3"><i class="fa fa-check mr5"></i> ' + errors.join('</li><li class="mt3"><i class="fa fa-check mr5"></i> ') + '</li></ul></div>';
        html += '<div class="modal-footer"><button type="button" class="btn btn-primary" data-dismiss="modal">Ok</button></div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        $(html).modal();
        loadingPagoEnd();
    }
}

function getInstallments() {
    $(".issuersImg img").remove();
    $("#installments").empty();
    if (this.value != "") {
        $(".issuersImg").append('<img src="' + $(this).find(":selected").attr("data-thumbnail") + '" />');
        Mercadopago.getInstallments({"bin": 450995, "amount": planes[$("#plan").val()], "issuer_id": this.value}, function (status, response) {
            if (status == 200) {
                for (var i in response[0].payer_costs) {
                    $("[data-checkout='installments']").append('<option value="' + response[0].payer_costs[i].installments + '">' + response[0].payer_costs[i].recommended_message + '</option>');
                }
            }
        });
    }
}