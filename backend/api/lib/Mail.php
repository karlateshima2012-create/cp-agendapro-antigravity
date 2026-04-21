<?php

class Mail {
    /**
     * Sends an HTML email
     */
    public static function send($to, $subject, $body) {
        $fromName = "CP Agenda Pro";
        $fromEmail = "suporte@creativeprintjp.com";
        
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: {$fromName} <{$fromEmail}>" . "\r\n";
        $headers .= "Reply-To: {$fromEmail}" . "\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();
        
        // Try to send using PHP's mail function
        // Note: For production, using a library like PHPMailer or an API (SendGrid/Postmark) is recommended
        return mail($to, $subject, $body, $headers);
    }
}
