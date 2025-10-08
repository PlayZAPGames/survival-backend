import express from 'express';
import prisma  from '../../prisma/db.js';
import { makeResponse, statusCodes, responseMessages } from '../../helpers/index.js';
const { SUCCESS } = statusCodes;
import { validators } from '../../middleware/validateResource/index.js';
const router = express.Router();


router.get('/store', async (req, res) => {
   const { type } = req.query;
   const items = await prisma.storeItem.findMany({
      where: type ? { type: type } : {},
      orderBy: { id: "asc" },
    });
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_FOUND, {items });
});

router.post('/store', validators('ADD_STORE_ITEM'), async (req, res) => {
    const { name, description, price, type, isActive, isDefault } = req.body;
    const item = await prisma.storeItem.create({
      data: {
        name,
        description,
        price,
        type, 
        isActive: isActive ?? false,
        isDefault: isDefault ?? false,
      },
    });

  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_CREATED, item );
});


router.patch('/store/:id', validators('UPDATE_STORE_ITEM'), async (req, res) => {
   const { id } = req.params;
  const { name, description, price, imageUrl, isActive, isDefault } = req.body;

    const item = await prisma.storeItem.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price }),
        ...(imageUrl && { imageUrl }),
        ...(isActive !== undefined && { isActive }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_UPDATED, item);
});


export default router;
