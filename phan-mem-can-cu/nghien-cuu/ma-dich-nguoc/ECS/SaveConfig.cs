using System;
using System.Drawing;

namespace ECS;

[Serializable]
public class SaveConfig
{
	public string MG_xxxRight;

	public int MG_AdminInCharge;

	public bool MG_UnitPriceChangeForbidden;

	public bool MG_GrandTotalChangeForbidden;

	public int MG_AccuClear;

	public int MG_Unconfirm;

	public int MG_ZeroBack;

	public int MG_PriceFProg;

	public int MG_ZeroReturn;

	public int MG_BuyBack;

	public int MG_Payments;

	public int MG_Hangup;

	public int MISC_UPPoint;

	public int MISC_TPPoint;

	public int MISC_STRounding;

	public int MISC_TTRounding;

	public string MISC_Prefix;

	public string MISC_Suffix;

	public bool MISC_PrintUnit_Amount;

	public bool MISC_PrintUnit_UPrice;

	public bool MISC_PrintUnit_Money;

	public int MISC_PLUInfo_Font;

	public int MISC_PLUInfo_S1;

	public int MISC_PLUInfo_S2;

	public int MISC_IdleInfo_Font;

	public int MISC_IdleInfo_S;

	public string MISC_IdleInfo_SS;

	public int MISC_AccuInfo_S;

	public bool PW_Admin_Sel;

	public string PW_Admin_String;

	public bool PW_Sale_Sel;

	public string PW_Sale_String;

	public bool PW_Prog_Sel;

	public string PW_Prog_String;

	public bool PW_Account_Sel;

	public string PW_Account_String;

	public bool PW_Drawer_Sel;

	public string PW_Drawer_String;

	public bool PW_PriceFProg_Sel;

	public string PW_PriceFProg_String;

	public bool PLU_Remark;

	public bool PLU_Index;

	public bool PLU_PS_UD;

	public bool PLU_Cost;

	public bool PLU_Tare;

	public bool PLU_Class;

	public bool PLU_Tax;

	public bool PLU_SspValue1;

	public bool PLU_SspValue2;

	public bool PLU_SspValue3;

	public bool PLU_SspValue4;

	public bool PLU_labelID1;

	public bool PLU_barT1;

	public bool PLU_barF1;

	public bool PLU_labelID2;

	public bool PLU_barT2;

	public bool PLU_barF2;

	public bool PLU_Bitmap;

	public bool PLU_Text1;

	public bool PLU_Text2;

	public bool PLU_Text3;

	public bool PLU_Text4;

	public bool PLU_Text5;

	public bool PLU_Text6;

	public bool PLU_Text7;

	public string SCP_ScaleID;

	public string SCP_Page;

	public Font SCP_Font;

	public string Device;

	public string Device_A;

	public string Device_C;

	public string OpMain;

	public bool OpMain_LabelBarcode;

	public bool OpMain_Management;

	public bool OpMain_SaleOperation;

	public bool OpMain_UnitDisplay;

	public bool OpMain_PLU;

	public bool OpMain_ShortcutKey;

	public bool Mode_Prepack;

	public bool Mode_OneItemOnly;

	public bool Mode_PrintDirect;

	public bool Mode_ScanInternalBarcode;

	public bool Mode_GapPaper;

	public int Mode_Gray;

	public int Mode_GapPaperType;

	public int Mode_PlainPaperType;

	public int PT_ItemLabel;

	public int PT_SumLabel;

	public int PT_Receipt;

	public bool PT_Bitmap_Used;

	public string[] PT_GlobalText;

	public bool[] PT_GlobalText_ED;

	public bool Barcode_ED;

	public int Barcode_Main;

	public int Barcode_CR_Type;

	public int Barcode_CR_Flag_Item;

	public int Barcode_CR_Flag_Sum;

	public bool Barcode_CR_Flag_SumUsingItem;

	public int Barcode_CR_Item_P2;

	public bool Barcode_CR_Item_P3_Weight;

	public int Barcode_CR_CheckType;

	public bool Barcode_CR_Sum_UsePcsAsAmount;

	public bool Barcode_CR_QR;

	public int Barcode_CR_QR_Para;

	public int Barcode_CR_QR_Version;

	public bool Barcode_CR_Decimal_Money_Use;

	public bool Barcode_CR_Decimal_Weight_Use;

	public bool Barcode_CR_Decimal_Pcs_Use;

	public int Barcode_CR_Decimal_Money;

	public int Barcode_CR_Decimal_Weight;

	public int Barcode_CR_Decimal_Pcs;

	public int Barcode_SP_Type;

	public int Barcode_SP_PLUInfo;

	public string Barcode_SP_Constant;

	public int Barcode_SP_BType;

	public bool Barcode_SP_TryAddCheckDigit;

	public int Barcode_ME_BType;

	public bool Barcode_ME_TryAddCheckDigit;

	public string Barcode_ME_Source;

	public bool[] wcStep;

	public string TMSout;

	public int ValidCheck;
}
