
package com.cosmunity.cosmunity_backend.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String remetente;

    public EmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${spring.mail.username:}") String remetente
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.remetente = remetente;
    }

    public void enviarCodigoConfirmacao(
            String destinatario,
            String codigo
    ) {

        String assunto = "CosMunity - Confirmação de e-mail";

        String mensagem = """
                Bem-vindo ao CosMunity!

                Seu código de confirmação é: %s

                Este código expira em 10 minutos.

                Caso você não tenha solicitado este cadastro,
                ignore este e-mail.

                Atenciosamente,
                Equipe CosMunity
                """.formatted(codigo);

        enviarEmail(destinatario, assunto, mensagem);
    }

    public void enviarCodigoRecuperacao(
            String destinatario,
            String codigo
    ) {

        String assunto = "CosMunity - Recuperação de senha";

        String mensagem = """
                Recebemos uma solicitação de recuperação
                de senha da sua conta CosMunity.

                Seu código de recuperação é: %s

                Este código expira em 10 minutos.

                Caso você não tenha solicitado a recuperação,
                ignore este e-mail.

                Atenciosamente,
                Equipe CosMunity
                """.formatted(codigo);

        enviarEmail(destinatario, assunto, mensagem);
    }

    private void enviarEmail(
            String destinatario,
            String assunto,
            String mensagem
    ) {

        JavaMailSender mailSender =
                mailSenderProvider.getIfAvailable();

        if (mailSender == null || remetente.isBlank()) {
            throw new IllegalStateException(
                    "O serviço de e-mail ainda não foi configurado."
            );
        }

        SimpleMailMessage email = new SimpleMailMessage();

        email.setFrom(remetente);
        email.setTo(destinatario);
        email.setSubject(assunto);
        email.setText(mensagem);

        mailSender.send(email);
    }
}