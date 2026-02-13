<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 40px;">

    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">

                <table width="600" cellpadding="0" cellspacing="0" 
                       style="background-color: #ffffff; padding: 30px; border-radius: 8px;">

                    <!-- Greeting -->
                    <tr>
                        <td style="font-size: 18px; font-weight: bold; padding-bottom: 15px;">
                            Hi {{ $chatMessage->receiver->first_name }},
                        </td>
                    </tr>

                    <!-- Message -->
                    <tr>
                        <td style="font-size: 14px; color: #555; padding-bottom: 15px;">
                            You have unread messages on <strong>HealthHub</strong> from
                            <strong>
                                {{ $chatMessage->sender->first_name }}
                                {{ $chatMessage->sender->last_name }}
                            </strong>.
                        </td>
                    </tr>

                    <!-- Button -->
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <a href="{{ url('/messages') }}"
                               style="
                                   background-color: #2563eb;
                                   color: #ffffff;
                                   padding: 12px 20px;
                                   text-decoration: none;
                                   border-radius: 5px;
                                   display: inline-block;
                                   font-size: 14px;
                               ">
                                Open Messages
                            </a>
                        </td>
                    </tr>

                    <!-- Privacy note -->
                    <tr>
                        <td style="font-size: 12px; color: #888; padding-top: 15px;">
                            For your privacy, message content is not included in this email.
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="font-size: 12px; color: #aaa; padding-top: 25px; border-top: 1px solid #eee;">
                            Thank you for using HealthHub.
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
