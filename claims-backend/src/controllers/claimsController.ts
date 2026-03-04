import { Response } from 'express';
import { db, messaging } from '../config/firebase';
import { AuthRequest } from '../middleware/auth';
import { FieldValue } from 'firebase-admin/firestore';

export const getClaims = async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await db
      .collection('claims')
      .where('userId', '==', req.userId)
      .orderBy('createdAt', 'desc')
      .get();

    const claims = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ claims });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
};

export const getClaimById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docId = Array.isArray(id) ? id[0] : id;
    const doc = await db.collection('claims').doc(docId).get();

    if (!doc.exists || doc.data()?.userId !== req.userId) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claim' });
  }
};

export const updateClaimStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adjusterNote, adjusterName } = req.body;

    const docId = Array.isArray(id) ? id[0] : id;
    const claimRef = db.collection('claims').doc(docId);
    const claimDoc = await claimRef.get();

    if (!claimDoc.exists) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const claim = claimDoc.data()!;
    const statusHistory = claim.statusHistory || [];
    statusHistory.push({
      key: status,
      label: getStatusLabel(status),
      timestamp: new Date().toISOString(),
    });

    await claimRef.update({
      status,
      statusHistory,
      adjusterNote: adjusterNote || null,
      adjusterName: adjusterName || claim.adjusterName,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Send push notification
    await sendStatusNotification(claim.userId, claim.referenceNumber, status);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update claim' });
  }
};

async function sendStatusNotification(
  userId: string,
  referenceNumber: string,
  status: string
) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const token = userDoc.data()?.expoPushToken;

    if (!token) return;

    const messages: Record<string, { title: string; body: string }> = {
      under_review: {
        title: '🔍 Claim Under Review',
        body: `Ref ${referenceNumber}: Your claim is now being reviewed by our team.`,
      },
      info_required: {
        title: '⚠️ Action Required',
        body: `Ref ${referenceNumber}: Please provide additional information for your claim.`,
      },
      approved: {
        title: '✅ Claim Approved!',
        body: `Great news! Your claim ${referenceNumber} has been approved.`,
      },
      rejected: {
        title: '❌ Claim Update',
        body: `Ref ${referenceNumber}: Your claim requires attention. Please contact support.`,
      },
      paid: {
        title: '💰 Payment Processed',
        body: `Ref ${referenceNumber}: Your claim payment has been processed.`,
      },
    };

    const notifData = messages[status];
    if (!notifData) return;

    // Use Expo Push Notification service
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title: notifData.title,
        body: notifData.body,
        data: { status, referenceNumber },
      }),
    });

    // Also save to Firestore notifications collection
    await db.collection('notifications').add({
      userId,
      title: notifData.title,
      body: notifData.body,
      claimRef: referenceNumber,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Notification error:', error);
  }
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    submitted: 'Submitted',
    under_review: 'Under Review',
    info_required: 'Info Required',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Payment Sent',
  };
  return map[status] || status;
}