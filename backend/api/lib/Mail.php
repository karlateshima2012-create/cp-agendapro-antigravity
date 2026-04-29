<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../../vendor/autoload.php';

class Mail {
    /**
     * Sends an HTML email via SMTP
     */
    public static function send($to, $subject, $body) {
        $mail = new PHPMailer(true);

        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host       = 'smtp.hostinger.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = 'suporte@creativeprintjp.com';
            $mail->Password   = 'CPgestaoCRM23%';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL
            $mail->Port       = 465;
            $mail->CharSet    = 'UTF-8';

            // Recipients
            $mail->setFrom('suporte@creativeprintjp.com', 'CP Agenda Pro');
            $mail->addAddress($to);
            $mail->addReplyTo('suporte@creativeprintjp.com', 'Suporte');

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;
            $mail->AltBody = strip_tags($body);

            return $mail->send();
        } catch (Exception $e) {
            error_log("MAIL_ERROR: {$mail->ErrorInfo}");
            return false;
        }
    }
}
