import { AuditLog } from '../models/index.js';

export function logAction(req, action, resource, resourceId, changes = {}) {
  return AuditLog.create({
    actor: req.user?._id,
    action,
    resource,
    resourceId: resourceId?.toString(),
    changes,
    ipAddress: req.ip
  });
}
