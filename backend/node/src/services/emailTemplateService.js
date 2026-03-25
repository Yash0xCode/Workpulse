const applicationName = 'WorkPulse'

export const buildLeavePendingApprovalEmail = ({ employeeName, leaveType, startDate, endDate }) => {
  const subject = `[${applicationName}] Leave request pending approval`
  const text = `${employeeName || 'An employee'} submitted a ${leaveType || 'leave'} request from ${startDate || 'N/A'} to ${endDate || 'N/A'} and it requires your review.`
  const html = `
    <h3>Leave Request Pending Approval</h3>
    <p><strong>${employeeName || 'An employee'}</strong> submitted a <strong>${leaveType || 'leave'}</strong> request.</p>
    <p>From: <strong>${startDate || 'N/A'}</strong><br/>To: <strong>${endDate || 'N/A'}</strong></p>
    <p>Please review it in ${applicationName}.</p>
  `

  return { subject, text, html }
}

export const buildLeaveDecisionEmail = ({ employeeName, reviewerName, status, leaveType, startDate, endDate }) => {
  const decision = String(status || '').toLowerCase()
  const subject = `[${applicationName}] Leave request ${decision || 'updated'}`
  const text = `${reviewerName || 'A reviewer'} marked ${employeeName || 'your'} ${leaveType || 'leave'} request (${startDate || 'N/A'} to ${endDate || 'N/A'}) as ${decision || 'updated'}.`
  const html = `
    <h3>Leave Request ${decision || 'Updated'}</h3>
    <p>${reviewerName || 'A reviewer'} updated <strong>${employeeName || 'your'}</strong> request.</p>
    <p>Type: <strong>${leaveType || 'leave'}</strong><br/>From: <strong>${startDate || 'N/A'}</strong><br/>To: <strong>${endDate || 'N/A'}</strong></p>
    <p>New status: <strong>${decision || 'updated'}</strong></p>
  `

  return { subject, text, html }
}
