import { jsPDF } from 'jspdf';

export const generateODLetter = (odData, studentProfile) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 20;

    // --- Header ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(190, 30, 45); // CIT Red-ish color
    doc.text("CHENNAI INSTITUTE OF TECHNOLOGY", pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100); // Gray
    doc.text("Sarathy Nagar, Kundrathur, Chennai - 600069", pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // --- Line Separator ---
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    // --- Title ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text("OD APPROVAL RECORD", pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

    // --- Status Banner ---
    doc.setFillColor(230, 255, 230); // Light Green
    doc.setDrawColor(0, 128, 0); // Green
    doc.rect(margin, yPos, contentWidth, 15, 'FD');

    doc.setFontSize(12);
    doc.setTextColor(0, 100, 0);
    doc.setFont('helvetica', 'bold');
    doc.text("STATUS: APPROVED", pageWidth / 2, yPos + 10, { align: 'center' });

    yPos += 25;

    // --- Helper to draw sections ---
    const drawSectionTitle = (title, y) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 50);
        doc.text(title, margin, y);
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.5);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        return y + 12; // Extra space after line
    };

    const drawRow = (label, value, y) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text(label, margin, y);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        const labelWidth = 50;
        const valueX = margin + labelWidth;
        const maxWidth = contentWidth - labelWidth;

        const splitValue = doc.splitTextToSize(value || "-", maxWidth);
        doc.text(splitValue, valueX, y);

        return (splitValue.length * 6) + 4; // Return height used plus padding
    };

    // --- Section 1: Event Information ---
    yPos = drawSectionTitle("Event Information", yPos);

    // Check if it's an extended OD with multiple competitions
    if (odData.is_extension && odData.competitions_info && odData.competitions_info.length > 0) {

        // Loop through all competitions in the extension chain
        odData.competitions_info.forEach((comp, idx) => {
            const fromD = new Date(comp.from_date).toLocaleDateString('en-GB');
            const toD = new Date(comp.to_date).toLocaleDateString('en-GB');
            const dur = fromD === toD ? fromD : `${fromD} to ${toD}`;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(`${idx + 1}. ${comp.title}`, margin, yPos);
            yPos += 5;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80, 80, 80);
            doc.text(`    Duration: ${dur}`, margin, yPos);
            yPos += 8;
        });

        // Add Total Duration of the entire OD request (start of first to end of last)
        const totalFrom = new Date(odData.original_from_date || odData.from_date).toLocaleDateString('en-GB');
        const totalTo = new Date(odData.to_date).toLocaleDateString('en-GB');
        yPos += 5;
        yPos += drawRow("Overall Duration:", `${totalFrom} to ${totalTo}`, yPos);

    } else {
        // Single Competition
        const competitionName = odData.competitions?.title || "External Technical Event";
        const fromDate = new Date(odData.from_date).toLocaleDateString('en-GB');
        const toDate = new Date(odData.to_date).toLocaleDateString('en-GB');
        const duration = fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`;

        // Calculate days
        const diffTime = Math.abs(new Date(odData.to_date) - new Date(odData.from_date));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        yPos += drawRow("Event Name:", competitionName, yPos);
        yPos += drawRow("Dates:", duration, yPos);
        yPos += drawRow("Total Days:", `${diffDays} Day(s)`, yPos);
    }

    yPos += 8;

    // --- Section 2: Student Information ---
    yPos = drawSectionTitle("Student Participants", yPos);

    let students = [];

    // 1. Add Requester/Leader (Prioritize direct user fetch, then team leader, then profile)
    let leaderAdded = false;

    // A. From Top-level User (Requester) - BEST SOURCE
    if (odData.requester) {
        students.push({
            name: odData.requester.full_name,
            reg_no: odData.requester.registration_no
        });
        leaderAdded = true;
    }
    // B. From Team Leader Relation (Backup)
    else if (!leaderAdded && odData.teams?.users) {
        students.push({
            name: odData.teams.users.full_name,
            reg_no: odData.teams.users.registration_no
        });
        leaderAdded = true;
    }

    // 2. Add Teammates (from teams.members_info JSON)
    if (odData.teams?.members_info && Array.isArray(odData.teams.members_info)) {
        odData.teams.members_info.forEach(member => {
            // Check for duplicates (e.g. if leader is also in members_info)
            if (!students.some(s => s.reg_no === member.reg_no)) {
                students.push(member);
            }
        });
    }

    // 3. Fallback to studentProfile (Legacy/Individual without team record and no top-level user)
    if (students.length === 0 && studentProfile) {
        // Check multiple possible field names
        const sName = studentProfile.full_name || studentProfile.name || "Student";
        const sReg = studentProfile.register_number || studentProfile.reg_no || studentProfile.roll_no || "-";

        students.push({
            name: sName,
            reg_no: sReg
        });
    }

    if (students.length > 0) {
        students.forEach((student, index) => {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            const studentText = `${student.name} (${student.reg_no})`;
            doc.text(`•  ${studentText}`, margin + 5, yPos);
            yPos += 8;
        });
    } else {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.text("Student details not available.", margin, yPos);
        yPos += 8;
    }
    yPos += 10;

    // --- Section 3: Verification Details ---
    yPos = drawSectionTitle("System Verification", yPos);

    yPos += drawRow("Approved Date:", new Date(odData.created_at).toLocaleDateString('en-GB'), yPos);

    // Footer Note
    const footerY = 270;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text("This document is a computer-generated record of On-Duty approval.", pageWidth / 2, footerY, { align: 'center' });
    doc.text("Valid only for academic purposes at Chennai Institute of Technology.", pageWidth / 2, footerY + 5, { align: 'center' });

    // Save
    const firstCompTitle = odData.competitions?.title || "Event";
    const titleSafe = firstCompTitle.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `OD_Record_${titleSafe}.pdf`;
    doc.save(fileName);
};
