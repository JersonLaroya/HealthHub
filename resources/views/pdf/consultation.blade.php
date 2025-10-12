<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Clinic Consultation Record</title>
    <style type="text/css">
        * { margin: 0; padding: 0; text-indent: 0; }
        body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            text-align: center;
        }
        p { color: black; font-weight: bold; font-size: 10pt; margin: 0; }
        .s1 { font-family: "MS PGothic"; font-weight: normal; }
        .s2 { font-weight: normal; }
        .s3 { font-family: "Times New Roman"; text-decoration: underline; }
        .s5 { font-weight: bold; }
        .s6 { font-weight: normal; }
        .s7 { font-weight: bold; font-size: 11pt; }

        ul { list-style: none; padding: 0; }
        li { display: block; text-align: left; margin: 0 auto; width: 80%; }
        #l1 > li > *:first-child:before {
            content: "☐ ";
            font-family:"MS PGothic";
            font-size: 9pt;
        }

        table { margin: 0 auto; border-collapse: collapse; text-align: left; }
        td, th { vertical-align: top; border: 1px solid #000; padding: 4pt; }
        th { font-weight: bold; text-align: center; }

        .header-text {
            text-align: center;
            font-size: 11pt;
            margin-bottom: 4pt;
        }
        .header-subtext {
            text-align: center;
            font-size: 9pt;
            margin-bottom: 10pt;
        }
        .footer {
            text-align: center;
            font-size: 9pt;
            margin-top: 15pt;
        }
    </style>
</head>
<body>

    <!-- Header Section -->
    <p class="header-text">Republic of the Philippines<br>BOHOL ISLAND STATE UNIVERSITY</p>
    <p class="header-subtext">[Address, Zip Code, Bohol, Philippines]<br>Office of the ___________________________</p>
    <p class="header-subtext">Balance I Integrity I Stewardship I Uprightness</p>

    <!-- Role and School Year -->
    <ul id="l1">
        <li>
            <p>
                Student <span class="s1">☐</span> Faculty / Employee 
                &nbsp;&nbsp;&nbsp; Blood Type: <span class="s3">__________</span> 
                &nbsp;&nbsp;&nbsp; School Year: <span class="s3">____________</span>
            </p>
        </li>
    </ul>

    <!-- Basic Info Table -->
    <table style="width: 700pt; margin-top: 10pt;">
        <tr>
            <td style="width: 346pt;">Name:</td>
            <td style="width: 121pt;">Birth Date:</td>
            <td style="width: 57pt;">Sex:</td>
        </tr>
        <tr>
            <td>Home Address:</td>
            <td colspan="2">Contact Number (Student/Employee):</td>
        </tr>
        <tr>
            <td>Parent’s / Guardian’s / Spouse Name:</td>
            <td colspan="2" rowspan="2">
                Contact Number (Parent / Guardian / Spouse):<br><br>
                Course / Office:
            </td>
        </tr>
        <tr>
            <td>Present Address:</td>
        </tr>
    </table>

    <!-- Vital Signs -->
    <table style="width: 700pt; margin-top: 10pt;">
        <tr>
            <td style="width: 91pt;" align="center" class="s5">
                Initial<br>Vital Signs
            </td>
            <td style="width: 127pt;">BP: __________ / mmHg</td>
            <td style="width: 85pt;">RR: ____ bpm</td>
            <td style="width: 85pt;">PR: ____ bpm</td>
            <td style="width: 73pt;">Temp: ____ °C</td>
            <td style="width: 63pt;">O₂ Sat: ____ %</td>
        </tr>
    </table>

    <!-- Consultation Table -->
    <table style="width: 700pt; margin-top: 15pt;">
        <tr>
            <th style="width: 78pt;">Date &amp; Time</th>
            <th style="width: 78pt;">Vital Signs</th>
            <th style="width: 141pt;">Chief Complaint</th>
            <th style="width: 226pt;">Management &amp; Treatment</th>
        </tr>
        <tr style="height: 308pt;">
            <td></td><td></td><td></td><td></td>
        </tr>
    </table>

    <!-- Footer -->
    <div class="footer">
        F-SAS-HWS-003 | Rev. 2 | 07/01/24 | Page 1 of 2
    </div>

</body>
</html>
