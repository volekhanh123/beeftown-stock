using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Formatters.Binary;
using System.Windows.Forms;

namespace ECS;

internal class BitmapFuc
{
	public static int SinglePictureByID(SinglePicture x, SinglePicture y)
	{
		if (x == null)
		{
			if (y == null)
			{
				return 0;
			}
			return 1;
		}
		if (y == null)
		{
			return -1;
		}
		return x.ID.CompareTo(y.ID);
	}

	public static void DataSet_Bitmap_Load_Sim(ref ECSDataSet ctData, ref UIDataSet uiSet)
	{
		DataSet_Bitmap_Load_Sim(ref ctData);
		foreach (ECSDataSet.BitmapRow item in ctData.Bitmap)
		{
			UIDataSet.LabelItem_Flag2Row labelItem_Flag2Row = uiSet.LabelItem_Flag2.FindByFlag1Flag2(6, item.ID);
			if (labelItem_Flag2Row != null)
			{
				labelItem_Flag2Row.Display = $"{item.ID} - {item.Name} ({item.PicSize})";
			}
			else if (item.ID >= 1 && item.ID <= 255)
			{
				labelItem_Flag2Row = uiSet.LabelItem_Flag2.NewLabelItem_Flag2Row();
				labelItem_Flag2Row.Flag1 = 6;
				labelItem_Flag2Row.Flag2 = item.ID;
				labelItem_Flag2Row.Display = $"{item.ID} - {item.Name} ({item.PicSize})";
				uiSet.LabelItem_Flag2.AddLabelItem_Flag2Row(labelItem_Flag2Row);
			}
		}
	}

	public static void DataSet_Bitmap_Load_Sim(ref ECSDataSet ctData)
	{
		try
		{
			IFormatter formatter = new BinaryFormatter();
			Stream stream = new FileStream(Application.StartupPath + "\\ECS.SBP", FileMode.Open, FileAccess.Read, FileShare.Read);
			List<SinglePicture> list = (List<SinglePicture>)formatter.Deserialize(stream);
			stream.Close();
			ctData.Bitmap.Clear();
			list.Sort(SinglePictureByID);
			ECSDataSet.BitmapRow bitmapRow = ctData.Bitmap.NewBitmapRow();
			bitmapRow.ID = 0;
			bitmapRow.Name = "";
			bitmapRow.Used = 1;
			bitmapRow.PicSize = "";
			bitmapRow.Picture = null;
			bitmapRow.PicString = "";
			ctData.Bitmap.AddBitmapRow(bitmapRow);
			foreach (SinglePicture item in list)
			{
				bitmapRow = ctData.Bitmap.NewBitmapRow();
				bitmapRow.ID = item.ID;
				bitmapRow.Name = item.Name;
				bitmapRow.Used = item.Used;
				bitmapRow.PicSize = item.PicSize;
				bitmapRow.Picture = null;
				bitmapRow.PicString = "";
				bitmapRow.Des = $"{bitmapRow.ID} - {bitmapRow.Name} ({bitmapRow.PicSize})";
				ctData.Bitmap.AddBitmapRow(bitmapRow);
			}
		}
		catch (Exception)
		{
			ctData.Bitmap.Clear();
		}
	}

	public static void DataSet_Bitmap_SortCheck(ref List<SinglePicture> lsp)
	{
		lsp.Sort(SinglePictureByID);
		int num = 1;
		int num2 = 0;
		while (num2 < lsp.Count)
		{
			if (lsp[num2].ID < num)
			{
				lsp.Remove(lsp[num2]);
				continue;
			}
			num = lsp[num2].ID + lsp[num2].Used;
			num2++;
		}
	}

	public static void DataSet_Bitmap_SortCheck(ref List<SinglePicture> lsp, ref ECSDataSet ctData)
	{
		lsp.Sort(SinglePictureByID);
		int num = 1;
		int num2 = 0;
		while (num2 < lsp.Count)
		{
			if (lsp[num2].ID < num)
			{
				if (ctData != null)
				{
					ctData.Bitmap.FindByID(lsp[num2].ID).Delete();
				}
				lsp.Remove(lsp[num2]);
			}
			else
			{
				num = lsp[num2].ID + lsp[num2].Used;
				num2++;
			}
		}
	}

	public static void DataSet_Bitmap_Update(ref List<SinglePicture> lsp, ref ECSDataSet ctData)
	{
		ctData.Bitmap.Clear();
		foreach (SinglePicture item in lsp)
		{
			ECSDataSet.BitmapRow brow = ctData.Bitmap.NewBitmapRow();
			brow.ID = item.ID;
			brow.Name = item.Name;
			brow.Used = item.Used;
			brow.PicSize = item.PicSize;
			brow.Picture = item.Picture;
			brow.PicString = item.PicString;
			DataSet_Bitmap_RowCheck(ref brow);
			ctData.Bitmap.AddBitmapRow(brow);
		}
	}

	public static void DataSet_Bitmap_Load(ref List<SinglePicture> lsp)
	{
		try
		{
			IFormatter formatter = new BinaryFormatter();
			Stream stream = new FileStream(Application.StartupPath + "\\ECS.SBP", FileMode.Open, FileAccess.Read, FileShare.Read);
			lsp = (List<SinglePicture>)formatter.Deserialize(stream);
			stream.Close();
		}
		catch (Exception)
		{
			lsp = new List<SinglePicture>();
		}
		DataSet_Bitmap_SortCheck(ref lsp);
	}

	public static void DataSet_Bitmap_Load(ref List<SinglePicture> lsp, ref ECSDataSet ctData)
	{
		DataSet_Bitmap_Load(ref lsp);
		DataSet_Bitmap_Update(ref lsp, ref ctData);
	}

	public static void DataSet_Bitmap_Save(ref List<SinglePicture> lsp)
	{
		IFormatter formatter = new BinaryFormatter();
		Stream stream = new FileStream(Application.StartupPath + "\\ECS.SBP", FileMode.Create, FileAccess.Write, FileShare.None);
		formatter.Serialize(stream, lsp);
		stream.Close();
	}

	public static bool DataSet_Bitmap_Remove(ref List<SinglePicture> lsp, int ctID)
	{
		foreach (SinglePicture item in lsp)
		{
			if (item.ID == ctID)
			{
				lsp.Remove(item);
				return true;
			}
		}
		return false;
	}

	public static void DataSet_Bitmap_RowCheck(ref ECSDataSet.BitmapRow brow)
	{
		if (brow.Used <= 1)
		{
			brow.Occupied = "";
			return;
		}
		brow.Occupied = (brow.ID + 1).ToString();
		for (int i = brow.ID + 2; i < brow.ID + brow.Used; i++)
		{
			brow.Occupied = brow.Occupied + "," + i;
		}
		brow.Des = $"{brow.ID} - {brow.Name} ({brow.PicSize})";
	}

	public static void DataSet_Bitmap_Add(ref List<SinglePicture> lsp, ref ECSDataSet ctData, string Name, Image Picture, string PicString)
	{
		int num = (PicString.Length + 192 + 8191) / 8192;
		lsp.Sort(SinglePictureByID);
		int num2 = 1;
		for (int i = 0; i < lsp.Count && lsp[i].ID - num2 < num; i++)
		{
			num2 = lsp[i].ID + lsp[i].Used;
		}
		SinglePicture singlePicture = new SinglePicture();
		ECSDataSet.BitmapRow brow = ctData.Bitmap.NewBitmapRow();
		brow.ID = (singlePicture.ID = num2);
		brow.Name = (singlePicture.Name = Name);
		brow.Used = (singlePicture.Used = num);
		brow.Picture = (singlePicture.Picture = Picture);
		brow.PicString = (singlePicture.PicString = PicString);
		brow.PicSize = (singlePicture.PicSize = (double)Picture.Size.Width / 8.0 + "mm * " + (double)Picture.Size.Height / 8.0 + "mm");
		DataSet_Bitmap_RowCheck(ref brow);
		lsp.Add(singlePicture);
		DataSet_Bitmap_SortCheck(ref lsp, ref ctData);
		ctData.Bitmap.AddBitmapRow(brow);
	}

	public static bool DataSet_Bitmap_ChangePic(ref List<SinglePicture> lsp, ref ECSDataSet ctData, int PicID, string Name, Image Picture, string PicString)
	{
		int num = (PicString.Length + 192 + 8191) / 8192;
		DataSet_Bitmap_SortCheck(ref lsp, ref ctData);
		int num2 = -1;
		for (int i = 0; i < lsp.Count; i++)
		{
			if (lsp[i].ID < PicID)
			{
				if (lsp[i].ID + lsp[i].Used > PicID)
				{
					return false;
				}
			}
			else if (lsp[i].ID == PicID)
			{
				num2 = i;
			}
			else if (lsp[i].ID < PicID + num)
			{
				return false;
			}
		}
		if (num2 < 0)
		{
			return false;
		}
		ECSDataSet.BitmapRow brow = ctData.Bitmap.FindByID(lsp[num2].ID);
		brow.Used = (lsp[num2].Used = num);
		brow.Picture = (lsp[num2].Picture = Picture);
		brow.PicString = (lsp[num2].PicString = PicString);
		brow.PicSize = (lsp[num2].PicSize = (double)Picture.Size.Width / 8.0 + "mm * " + (double)Picture.Size.Height / 8.0 + "mm");
		DataSet_Bitmap_RowCheck(ref brow);
		return true;
	}

	public static void DataSet_Bitmap_Overwrite(ref List<SinglePicture> lsp, int PicID, string Name, Image Picture, string PicString)
	{
		int num = (PicString.Length + 192 + 8191) / 8192;
		DataSet_Bitmap_SortCheck(ref lsp);
		int num2 = 0;
		while (num2 < lsp.Count)
		{
			if ((lsp[num2].ID < PicID && lsp[num2].ID + lsp[num2].Used <= PicID) || lsp[num2].ID >= PicID + num)
			{
				num2++;
			}
			else
			{
				lsp.Remove(lsp[num2]);
			}
		}
		SinglePicture singlePicture = new SinglePicture();
		singlePicture.ID = PicID;
		singlePicture.Name = Name;
		singlePicture.Used = num;
		singlePicture.Picture = Picture;
		singlePicture.PicString = PicString;
		singlePicture.PicSize = (double)Picture.Size.Width / 8.0 + "mm * " + (double)Picture.Size.Height / 8.0 + "mm";
		lsp.Add(singlePicture);
		DataSet_Bitmap_SortCheck(ref lsp);
	}

	public static bool DataSet_Bitmap_AlignUp(ref List<SinglePicture> lsp, ref ECSDataSet ctData)
	{
		bool result = false;
		lsp.Sort(SinglePictureByID);
		int num = 1;
		for (int i = 0; i < lsp.Count; i++)
		{
			if (lsp[i].ID != num)
			{
				ctData.Bitmap.FindByID(lsp[i].ID).ID = num;
				lsp[i].ID = num;
				result = true;
			}
			num += lsp[i].Used;
		}
		return result;
	}

	public static int DataSet_Bitmap_ShiftUp(ref List<SinglePicture> lsp, ref ECSDataSet ctData, int PicID)
	{
		lsp.Sort(SinglePictureByID);
		int num = 1;
		int num2 = 1;
		for (int i = 0; i < lsp.Count; i++)
		{
			if (lsp[i].ID < PicID)
			{
				num2 = num;
				num = lsp[i].ID + lsp[i].Used;
				continue;
			}
			if (lsp[i].ID == PicID)
			{
				if (num != lsp[i].ID)
				{
					ECSDataSet.BitmapRow brow = ctData.Bitmap.FindByID(lsp[i].ID);
					brow.ID = num;
					DataSet_Bitmap_RowCheck(ref brow);
					lsp[i].ID = num;
					return 1;
				}
				if (i >= 1)
				{
					ECSDataSet.BitmapRow brow2 = ctData.Bitmap.FindByID(lsp[i].ID);
					ECSDataSet.BitmapRow brow3 = ctData.Bitmap.FindByID(lsp[i - 1].ID);
					brow3.ID = 0;
					brow2.ID = num2;
					brow3.ID = num2 + lsp[i].Used;
					DataSet_Bitmap_RowCheck(ref brow2);
					DataSet_Bitmap_RowCheck(ref brow3);
					lsp[i].ID = num2;
					lsp[i - 1].ID = num2 + lsp[i].Used;
					lsp.Sort(SinglePictureByID);
					return 2;
				}
				continue;
			}
			return 0;
		}
		return 0;
	}

	public static int DataSet_Bitmap_ShiftDown(ref List<SinglePicture> lsp, ref ECSDataSet ctData, int PicID)
	{
		lsp.Sort(SinglePictureByID);
		for (int i = 0; i < lsp.Count; i++)
		{
			if (lsp[i].ID < PicID)
			{
				continue;
			}
			if (lsp[i].ID == PicID)
			{
				if (i < lsp.Count - 1)
				{
					if (lsp[i].ID + lsp[i].Used < lsp[i + 1].ID)
					{
						ECSDataSet.BitmapRow brow = ctData.Bitmap.FindByID(lsp[i].ID);
						brow.ID = lsp[i + 1].ID - lsp[i].Used;
						DataSet_Bitmap_RowCheck(ref brow);
						lsp[i].ID = lsp[i + 1].ID - lsp[i].Used;
						return 1;
					}
					ECSDataSet.BitmapRow brow2 = ctData.Bitmap.FindByID(lsp[i].ID);
					ECSDataSet.BitmapRow brow3 = ctData.Bitmap.FindByID(lsp[i + 1].ID);
					int iD = lsp[i].ID;
					int iD2 = lsp[i].ID + lsp[i + 1].Used;
					brow2.ID = 0;
					brow3.ID = iD;
					brow2.ID = iD2;
					DataSet_Bitmap_RowCheck(ref brow2);
					DataSet_Bitmap_RowCheck(ref brow3);
					lsp[i].ID = iD2;
					lsp[i + 1].ID = iD;
					lsp.Sort(SinglePictureByID);
					return 2;
				}
				return 0;
			}
			return 0;
		}
		return 0;
	}
}
