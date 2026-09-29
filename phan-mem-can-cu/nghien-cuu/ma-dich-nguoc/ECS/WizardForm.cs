using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Printing;
using System.Globalization;
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Formatters.Binary;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;
using MyBarItemBox;

namespace ECS;

public class WizardForm : Form
{
	private enum DragState
	{
		Move,
		LeftTop,
		LeftBottom,
		RightTop,
		RightBottom,
		Left,
		Right,
		Top,
		Bottom,
		LabelBottom,
		LabelRight,
		LabelRightBottom,
		Select
	}

	private class SimComboVD_No
	{
		private int value;

		private string display;

		public int Value
		{
			get
			{
				return value;
			}
			set
			{
				this.value = value;
			}
		}

		public string Display
		{
			get
			{
				return display;
			}
			set
			{
				display = value;
			}
		}
	}

	private enum WizardConfigStep
	{
		DoWhat,
		Device,
		OperationMode,
		PT_1,
		PT_2,
		PT_3,
		Barcode,
		Management,
		SaleOpConfig,
		Unit,
		W5th,
		PLU,
		Face,
		TMSout,
		AllEnd
	}

	private class BLINK
	{
		public Control cl;

		public string text;
	}

	private const int PT_GlobalText_Length = 28;

	private const int BI_Max = 32;

	private Font _font;

	private Font _idFont;

	private float _dpiGx;

	private float _dpiBx;

	private float _dpiGy;

	private float _dpiBy;

	private Bitmap _bitmap;

	private string _layout;

	private string _page;

	private Rectangle rcCur;

	private Rectangle rcLeftTop;

	private Rectangle rcLeftBottom;

	private Rectangle rcRightTop;

	private Rectangle rcRightBottom;

	private Rectangle rcLeft;

	private Rectangle rcRight;

	private Rectangle rcTop;

	private Rectangle rcBottom;

	private Rectangle rcLabelBottom;

	private Rectangle rcLabelRight;

	private Rectangle rcLabelRightBottom;

	private List<int> _list = new List<int>(100);

	private int _list_ct = -1;

	private bool _bIsDrag;

	private Point _ptStart;

	private int _diffX;

	private int _diffY;

	private int _left;

	private int _top;

	private int _width;

	private int _height;

	private int _labelWidth;

	private int _labelHeight;

	private DragState _dragState;

	private bool bMulti_S;

	private bool bMulti_C;

	private BarItemBox[] BarItemBox;

	private SimComboVD_No[] ctFuc;

	public SaveConfig ctSC = new SaveConfig();

	private WizardConfigStep wcStep;

	private bool[] wcStep_Enable;

	private bool[] wcStep_Enable_Plus;

	private int no_PTCloneTo = 26;

	private UIDataSet.CustomRow custom1Row;

	private UIDataSet.CustomRow custom2Row;

	private UIDataSet.CustomRow custom3Row;

	private UIDataSet.CustomRow custom4Row;

	private List<Panel> pt_Info_Panel = new List<Panel>(100);

	private List<SinglePicture> pt_LSP;

	private bool subid_changing;

	private Image im1_ethernet;

	private Image im2_ethernet;

	private Image im1_usb;

	private Image im2_usb;

	private int lastID;

	private bool pt_Editing;

	private bool TChar_In;

	private List<BLINK> blink = new List<BLINK>(20);

	private bool blinkFlag;

	private IContainer components;

	private Panel Main_panel;

	private TableLayoutPanel tableLayoutPanel;

	private GroupBox P1_Part5_groupBox;

	private RadioButton P1_Check_C0_radioButton;

	private RadioButton P1_Check_NS_radioButton;

	private RadioButton P1_Check_S_radioButton;

	private GroupBox P1_Part4_groupBox;

	private RadioButton P1_P4Total_radioButton;

	private RadioButton P1_P4Amount_radioButton;

	private GroupBox P1_Part3_groupBox;

	private RadioButton P1_P3Total_radioButton;

	private RadioButton P1_P3Amount_radioButton;

	private GroupBox P1_Part2_groupBox;

	private NumericUpDown P1_P2Const_numericUpDown;

	private RadioButton P1_P2Const_radioButton;

	private RadioButton P1_P2PLUNumber_radioButton;

	private RadioButton P1_P2ItemCode_radioButton;

	private GroupBox P1_Type_groupBox;

	private RadioButton P1_Type15651_radioButton;

	private Label P1_label2;

	private RadioButton P1_Type16551_radioButton;

	private RadioButton P1_Type2551_radioButton;

	private RadioButton P1_Type1561_radioButton;

	private RadioButton P1_Type2641_radioButton;

	private RadioButton P1_Type1651_radioButton;

	private RadioButton P1_Type25551_radioButton;

	private RadioButton P1_Type2461_radioButton;

	private Label P1_label1;

	private RadioButton P1_Type26451_radioButton;

	private RadioButton P1_Type24651_radioButton;

	private GroupBox P1_Part3_4Sum_groupBox;

	private RadioButton P1_P3_4TotalPcs_radioButton;

	private RadioButton P1_P3_4TotalWeight_radioButton;

	private GroupBox P1_Part1_2Sum_groupBox;

	private NumericUpDown P1_P1_2SumFlag_numericUpDown;

	private Label P1_P1_2_label;

	private GroupBox P1_Part1_groupBox;

	private NumericUpDown P1_P1_ItemFlag_numericUpDown;

	private Label P1_P1_label;

	private Label TE_label;

	private Panel pt_Panel;

	private Panel panel7;

	private RadioButton Mode_PlainPapper_RadioButton;

	private Label Mode_Gray_label;

	private RadioButton Mode_GapPapper_RadioButton;

	private NumericUpDown Mode_Gray_numericUpDown;

	private CheckBox Mode_PrintDirect_checkBox;

	private CheckBox Mode_OneItemOnly_checkBox;

	private RadioButton Mode_CashRegister_RadioButton;

	private RadioButton Mode_LabelPrint_RadioButton;

	private Panel Header_panel;

	private Button Ethernet_button;

	private Button TMSFile_button;

	private Button Next_button;

	private Button Previous_button;

	private Panel mode_Panel;

	private RadioButton OpMain_FirstConfig_radioButton;

	private RadioButton OpMain_WorkData_radioButton;

	private Panel barcode_panel;

	private CheckBox PT_Rotate_checkBox;

	private Panel manage_panel;

	private Panel device_Panel;

	private Label Device_D_Label;

	private Label Device_E_Label;

	private Label Device_A08_Label;

	private Label Device_B_Label;

	private Label Device_C15_Label;

	private Label Device_A12_Label;

	private PictureBox devicePictureBox;

	private RadioButton Device_E_RadioButton;

	private RadioButton Device_B_RadioButton;

	private RadioButton Device_D_RadioButton;

	private RadioButton Device_C_RadioButton;

	private RadioButton Device_A_RadioButton;

	private Panel Device_Axx_Panel;

	private RadioButton Device_A08_RadioButton;

	private RadioButton Device_A12_RadioButton;

	private Panel opMain_Panel;

	private Panel opconfig_panel;

	private Panel unit_panel;

	private Panel w5th_panel;

	private Panel plu_panel;

	private Panel face_panel;

	private Panel tmsout_panel;

	private Panel panel12;

	private Panel panel13;

	private Panel panel14;

	private Panel panel2;

	private Panel panel15;

	private Panel panel16;

	private Panel panel17;

	private Panel panel3;

	private Label label1;

	private SplitContainer pt_Top_SplitContainer;

	private SplitContainer pt_Main_SplitContainer;

	private SplitContainer pt_Left_SplitContainer;

	private SplitContainer pt_Right_SplitContainer;

	private ECSDataSet eCSDataSet;

	private BindingSource labelBindingSource;

	private DataGridView labelDataGridView;

	private SplitContainer pt_LeftUD_SplitContainer;

	private Label alignLabel;

	private Label fontLabel;

	private Panel panel5;

	private SplitContainer pt_LeftUDD_SplitContainer;

	private BindingSource labelItemBindingSource;

	private DataGridView labelitemDataGridView;

	private PictureBox pt_Sample_PictureBox;

	private Panel pt_Picture_Panel;

	private Button flagButton;

	private Panel Mode_PlainPapper_Panel;

	private RadioButton Mode_PlainPaper57_RadioButton;

	private RadioButton Mode_PlainPaper40_RadioButton;

	private RadioButton Mode_PlainPaper60_RadioButton;

	private Panel Mode_GapPapper_Panel;

	private RadioButton Mode_GapPaper60x30_RadioButton;

	private RadioButton Mode_GapPaper40x30_RadioButton;

	private RadioButton Mode_GapPaper60x40_RadioButton;

	private RadioButton Mode_GapPaper0_RadioButton;

	private RadioButton Mode_PlainPaper0_RadioButton;

	private BindingSource labelItemAlignBindingSource;

	private UIDataSet uIDataSet;

	private BindingSource labelItemFontBindingSource;

	private BindingSource labelItemPrintBindingSource;

	private BindingSource labelItemAngleBindingSource;

	private LabelItemTableAdapter labelItemTableAdapter;

	private LabelTableAdapter labelTableAdapter;

	private BindingSource labelSortBindingSource;

	private BindingSource labelVersionBindingSource;

	private Button alignButton;

	private ComboBox printComboBox;

	private ComboBox alignComboBox;

	private ComboBox angleComboBox;

	private ComboBox fontComboBox;

	private SplitContainer pt_LeftUDU_SplitContainer;

	private NumericUpDown PPheightMMNumericUpDown;

	private NumericUpDown PPwidthMMNumericUpDown;

	private NumericUpDown PPwidthNumericUpDown;

	private NumericUpDown PPheightNumericUpDown;

	private Button PT_Back_Button;

	private Label pt_Picture_Label;

	private PictureBox pt_Picture_PictureBox;

	private ComboBox pt_Picture_ComboBox;

	private TableLayoutPanel tp_Info_TableLayoutPanel;

	private Button pt_Picture_SelectButton;

	private Panel pt_InfoTextSample_Panel;

	private TextBox pt_InfoTextSample_TextBox;

	private Label pt_InfoTextSample_Label;

	private Button pt_Picture_ClearButton;

	private Button PT_EditClone_Button;

	private Label NextDisable_Label;

	private MyPanel subPanel;

	private BindingNavigator labelBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem;

	private ToolStripButton bindingNavigatorDeleteItem;

	private BindingNavigator labelItemBindingNavigator;

	private ToolStripButton toolStripButton2;

	private ToolStripButton toolStripButton1;

	private ToolStripButton cloneToolStripButton;

	private Panel barcode_Special_Panel;

	private Panel barcode_CashRegister_Panel;

	private RadioButton barcode_Special_RadioButton;

	private TextBox barcode_Special_Constant_TextBox;

	private RadioButton barcode_CashRegister_RadioButton;

	private ComboBox barcode_Special_PLUInfo_ComboBox;

	private RadioButton barcode_Special_PLUInfo_RadioButton;

	private RadioButton barcode_Special_Constant_RadioButton;

	private Label barcode_Special_Type_Label;

	private ComboBox barcode_Special_Type_ComboBox;

	private RadioButton barcode_ManualEdit_RadioButton;

	private CheckBox barcode_Special_CheckDigit_CheckBox;

	private CheckBox P1_Part1_2Sum_UseItem_CheckBox;

	private ComboBox barcode_ManualEdit_BType_ComboBox;

	private Label barcode_ManualEdit_Type_Label;

	private TableLayoutPanel BarSub_TableLayoutPanel;

	private Panel Info_Panel;

	private Label Group_Label;

	private NumericUpDown BarNum_NumericUpDown;

	private Label Version_Error_Label;

	private Label TE2_label;

	private TextBox TChar_TextBox;

	private Panel view_subpage_panel;

	private Label label4;

	private Label label5;

	private Label label6;

	private CheckBox barcode_ManualEdit_CheckDigit_CheckBox;

	private Panel barcode_ManualEdit_Panel;

	private BindingSource barcodeFormatBindingSource;

	private BindingSource barcodeFormat2BindingSource;

	private Timer blink_Timer;

	private SplitContainer pt_Mid_SplitContainer;

	private StringTableAdapter stringTableAdapter;

	private Label barcode_CashRegister_Info_Label;

	private Panel barcode_CashRegister_Info_Panel;

	private TableLayoutPanel tableLayoutPanel1;

	private Panel mg_Detail_Panel;

	private GroupBox P5_Unconfirmed_groupBox;

	private RadioButton P5_Unconfirmed_1_radioButton;

	private RadioButton P5_Unconfirmed_0_radioButton;

	private RadioButton P5_Unconfirmed_2_radioButton;

	private GroupBox P5_BuyBack_groupBox;

	private Panel panel18;

	private CheckBox P5_BuyBack_A2_checkBox;

	private Label P5_BuyBack_1_Label;

	private CheckBox P5_BuyBack_A32_checkBox;

	private CheckBox P5_BuyBack_A64_checkBox;

	private CheckBox P5_BuyBack_A256_checkBox;

	private CheckBox P5_BuyBack_A128_checkBox;

	private CheckBox P5_BuyBack_A1_checkBox;

	private CheckBox P5_BuyBack_A16_checkBox;

	private CheckBox P5_BuyBack_A8_checkBox;

	private CheckBox P5_BuyBack_A4_checkBox;

	private GroupBox P5_Hangup_groupBox;

	private RadioButton P5_Hangup_1_radioButton;

	private RadioButton P5_Hangup_0_radioButton;

	private RadioButton P5_Hangup_3_radioButton;

	private RadioButton P5_Hangup_2_radioButton;

	private GroupBox P5_VBuffer_groupBox;

	private RadioButton P5_VBuffer_3_radioButton;

	private RadioButton P5_VBuffer_0_radioButton;

	private RadioButton P5_VBuffer_1_radioButton;

	private RadioButton P5_VBuffer_2_radioButton;

	private GroupBox P5_ZeroReturn_groupBox;

	private RadioButton P5_ZeroReturn_0_radioButton;

	private RadioButton P5_ZeroReturn_4_radioButton;

	private RadioButton P5_ZeroReturn_3_radioButton;

	private GroupBox P5_PriceFProg_groupBox;

	private RadioButton P5_PriceFProg_1_radioButton;

	private RadioButton P5_PriceFProg_4_radioButton;

	private RadioButton P5_PriceFProg_2_radioButton;

	private RadioButton P5_PriceFProg_0_radioButton;

	private RadioButton P5_PriceFProg_3_radioButton;

	private GroupBox P5_TotalPrice_groupBox;

	private RadioButton P5_TotalPrice_Allowed_radioButton;

	private RadioButton P5_TotalPrice_Forbidden_radioButton;

	private GroupBox P5_UnitPrice_groupBox;

	private RadioButton P5_UnitPrice_Allowed_radioButton;

	private RadioButton P5_UnitPrice_Forbidden_radioButton;

	private GroupBox P5_Payments_groupBox;

	private CheckBox P5_Payments_A32_checkBox;

	private CheckBox P5_Payments_A16_checkBox;

	private CheckBox P5_Payments_A8_checkBox;

	private CheckBox P5_Payments_A4_checkBox;

	private CheckBox P5_Payments_A2_checkBox;

	private CheckBox P5_Payments_A1_checkBox;

	private GroupBox P5_Other_groupBox;

	private CheckBox P5_Other_USBboot_checkBox;

	private CheckBox P5_Other_scPLUFProg_checkBox;

	private CheckBox P5_Other_PLUFProg_checkBox;

	private CheckBox P5_Other_SpecFProg_checkBox;

	private GroupBox mg_Password_groupBox;

	private TextBox P5_AM_PriceFProg_textBox;

	private TextBox P5_AM_Drawer_textBox;

	private TextBox P5_AM_Account_textBox;

	private TextBox P5_AM_Prog_textBox;

	private TextBox P5_AM_Sale_textBox;

	private TextBox P5_AM_Admin_textBox;

	private CheckBox P5_AM_PriceFProg_checkBox;

	private CheckBox P5_AM_Drawer_checkBox;

	private CheckBox P5_AM_Account_checkBox;

	private CheckBox P5_AM_Prog_checkBox;

	private CheckBox P5_AM_Admin_checkBox;

	private CheckBox P5_AM_Sale_checkBox;

	private RadioButton MG_CustomRight_RadioButton;

	private RadioButton MG_NoRight_RadioButton;

	private RadioButton MG_LimitedRight_RadioButton;

	private RadioButton MG_FullRight_RadioButton;

	private GroupBox mg_AdminIC_groupBox;

	private CheckBox IllegalReboot_CheckBox;

	private CheckBox BuyBack_CheckBox;

	private CheckBox FProgPrice_CheckBox;

	private CheckBox TSaleWT_CheckBox;

	private CheckBox TSaleCT_CheckBox;

	private CheckBox Preprint_CheckBox;

	private CheckBox Reprint_CheckBox;

	private CheckBox HangupRead_CheckBox;

	private CheckBox HangupWrite_CheckBox;

	private CheckBox Drawer_CheckBox;

	private CheckBox Amend_CheckBox;

	private CheckBox ItemQuit_CheckBox;

	private Panel Device_Cxx_Display_Panel;

	private RadioButton Device_Cxx_5w_RadioButton;

	private RadioButton Device_Cxx_4w_RadioButton;

	private Panel Device_Axx_Display_Panel;

	private RadioButton Device_Axx_np_RadioButton;

	private RadioButton Device_Axx_5w_RadioButton;

	private RadioButton Device_Axx_4w_RadioButton;

	private Button P4_UpdateSoftware_button;

	private GroupBox P4_TotalRounding_groupBox;

	private RadioButton P4_TotalRounding0_S0_radioButton;

	private RadioButton P4_TotalRounding3_S10_radioButton;

	private RadioButton P4_TotalRounding2_S1_radioButton;

	private RadioButton P4_TotalRounding4_S2_radioButton;

	private RadioButton P4_TotalRounding1_S9_radioButton;

	private GroupBox P4_ItemRounding_groupBox;

	private RadioButton P4_ItemRounding0_S0_radioButton;

	private RadioButton P4_ItemRounding3_S10_radioButton;

	private RadioButton P4_ItemRounding2_S1_radioButton;

	private RadioButton P4_ItemRounding1_S9_radioButton;

	private RadioButton P4_ItemRounding4_S2_radioButton;

	private GroupBox P4_UPriceRadixPoint_groupBox;

	private RadioButton P4_UPriceRadixPoint3_radioButton;

	private RadioButton P4_UPriceRadixPoint2_radioButton;

	private RadioButton P4_UPriceRadixPoint0_radioButton;

	private RadioButton P4_UPriceRadixPoint1_radioButton;

	private GroupBox P4_TotalRadixPoint_groupBox;

	private RadioButton P4_TotalRadixPoint3_radioButton;

	private RadioButton P4_TotalRadixPoint2_radioButton;

	private RadioButton P4_TotalRadixPoint0_radioButton;

	private RadioButton P4_TotalRadixPoint1_radioButton;

	private GroupBox P2_UnitSetting_groupBox;

	private Label P2_PrintUnit_Money_label;

	private Label P2_PrintUnit_UPricePcs_label;

	private Label P2_PrintUnit_UPriceWeight_label;

	private Label P2_PrintUnit_Pcs_label;

	private Label P2_PrintUnit_tPcs_label;

	private Label P2_PrintUnit_addPcs_label;

	private Label P2_PrintUnit_addWeight_label;

	private Label P2_PrintUnit_tWeight_label;

	private Label P2_PrintUnit_Weight_label;

	private CheckBox P2_PrintUnit_Money_checkbox;

	private CheckBox P2_PrintUnit_UPrice_checkbox;

	private CheckBox P2_PrintUnit_Amount_checkbox;

	private TextBox P2_Suffix_textBox;

	private TextBox P2_Prefix_textBox;

	private Label P2_Suffix_label;

	private Label P2_Money_label;

	private Label P2_Prefix_label;

	private RadioButton P4_UPriceRadixPoint5_radioButton;

	private RadioButton P4_UPriceRadixPoint4_radioButton;

	private RadioButton P4_TotalRadixPoint5_radioButton;

	private RadioButton P4_TotalRadixPoint4_radioButton;

	private GroupBox P3_noPLUinfo_groupBox;

	private Panel P3_2_panel;

	private TextBox P3_Idleinfo_Source3_textBox;

	private Label P3_label4;

	private RadioButton P3_Idleinfo_Source0_radioButton;

	private RadioButton P3_Idleinfo_Source1_radioButton;

	private RadioButton P3_Idleinfo_Source2_radioButton;

	private RadioButton P3_Idleinfo_Source3_radioButton;

	private Panel panel6;

	private Label P3_label5;

	private RadioButton P3_Accedinfo_Source0_radioButton;

	private RadioButton P3_Accedinfo_Source1_radioButton;

	private Panel P3_1_panel;

	private Label P3_label3;

	private RadioButton P3_noPLUinfo_Font0_radioButton;

	private RadioButton P3_noPLUinfo_Font1_radioButton;

	private RadioButton P3_noPLUinfo_Font2_radioButton;

	private RadioButton P3_noPLUinfo_Font3_radioButton;

	private GroupBox P3_PLUinfo_groupBox;

	private ComboBox P3_PLUinfo_S2_comboBox;

	private ComboBox P3_PLUinfo_S1_comboBox;

	private CheckBox P3_DoubleSource_checkBox;

	private RadioButton P3_PLUinfo_Font3_radioButton;

	private RadioButton P3_PLUinfo_Font2_radioButton;

	private RadioButton P3_PLUinfo_Font1_radioButton;

	private Label P3_label2;

	private Label P3_label1;

	private RadioButton P3_PLUinfo_Font0_radioButton;

	private BindingSource pLUBindingSource;

	private Panel P7_panel;

	private BindingNavigator pLUBindingNavigator;

	private ToolStripLabel bindingNavigatorCountItem;

	private ToolStripButton bindingNavigatorMoveFirstItem;

	private ToolStripButton bindingNavigatorMovePreviousItem;

	private ToolStripSeparator bindingNavigatorSeparator;

	private ToolStripTextBox bindingNavigatorPositionItem;

	private ToolStripSeparator bindingNavigatorSeparator1;

	private ToolStripButton bindingNavigatorMoveNextItem;

	private ToolStripButton bindingNavigatorMoveLastItem;

	private ToolStripSeparator bindingNavigatorSeparator2;

	private ToolStripButton bindingNavigatorAddNewItem1;

	private ToolStripButton bindingNavigatorDeleteItem1;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripTextBox bindingNavigatorID;

	private ToolStripButton bindingNavigatorGoto;

	private ToolStripButton pluDataElement_ToolStripButton;

	private DataGridView pLUDataGridView;

	private BindingSource pLUPSDateBindingSource;

	private BindingSource scPLUP_bindingSource;

	private BindingSource faceListBindingSource;

	private BindingSource scPLUL_bindingSource;

	private SplitContainer splitContainer;

	private MyPanel myPanel;

	private Button delButton;

	private Button addButton;

	private Button autoButton;

	private Button clearButton;

	private CheckBox idCheckBox;

	private Label faceLabel;

	private ComboBox faceComboBox;

	private Label scaleID_Label;

	private Label layoutLabel;

	private ComboBox faceListComboBox;

	private ComboBox layoutComboBox;

	private Button fontButton;

	private Button saveButton;

	private PLUTableAdapter pluTableAdapter;

	private FaceTableAdapter faceTableAdapter;

	private FaceListTableAdapter faceListTableAdapter;

	private ClassTableAdapter classTableAdapter;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn5;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn Display;

	private Label angleLabel;

	private Label heightLabel;

	private Label widthLabel;

	private Label printLabel;

	private Label export_ethernet_Label;

	private Label export_usb_Label;

	private PictureBox export_ethernet_PictureBox;

	private PictureBox export_usb_PictureBox;

	private RadioButton OpMain_TMSout_radioButton;

	private Button reset_Button;

	private Label versionTip_Label;

	private BarcodeTableAdapter barcodeTableAdapter;

	private BindingSource unitBindingSource;

	private CheckBox OpMain_SCP_CheckBox;

	private CheckBox OpMain_PLU_CheckBox;

	private CheckBox OpMain_UnitDisplay_CheckBox;

	private CheckBox OpMain_SaleOperation_CheckBox;

	private CheckBox OpMain_Management_CheckBox;

	private CheckBox OpMain_LabelBarcode_CheckBox;

	private RadioButton Mode_GapPaper30x40_RadioButton;

	private CheckBox Mode_ScanInternalBarcode_checkBox;

	private RadioButton P5_VBuffer_4_radioButton;

	private GroupBox P5_ZeroBack_groupBox;

	private RadioButton P5_ZeroBack_1_radioButton;

	private RadioButton P5_ZeroBack_0_radioButton;

	private RadioButton P5_ZeroBack_2_radioButton;

	private RadioButton P5_ZeroBack_3_radioButton;

	private RadioButton P5_ZeroBack_4_radioButton;

	private GroupBox P1_Part6_groupBox;

	private NumericUpDown P1_Part6_PcsDecimal_NumericUpDown;

	private Label P1_Part6_PcsDecimal_Label;

	private NumericUpDown P1_Part6_MoneyDecimal_NumericUpDown;

	private Label P1_Part6_MoneyDecimal_Label;

	private NumericUpDown P1_Part6_WeightDecimal_NumericUpDown;

	private Label P1_Part6_WeightDecimal_Label;

	private Label P1_Part6_PcsDecimal_Ve_Label;

	private Label P1_Part6_WeightDecimal_Ve_Label;

	private Label P1_Part6_MoneyDecimal_Ve_Label;

	private Label P1_Part6_PcsDecimal_V2_Label;

	private Label P1_Part6_WeightDecimal_V2_Label;

	private Label P1_Part6_MoneyDecimal_V2_Label;

	private Label P1_Part6_PcsDecimal_V1_Label;

	private Label P1_Part6_WeightDecimal_V1_Label;

	private Label P1_Part6_MoneyDecimal_V1_Label;

	private StatusStrip pt_Mid_StatusStrip;

	private ToolStripStatusLabel pt_Mid_Height_TSSLabel;

	private ToolStripStatusLabel pt_Mid_Width_TSSLabel;

	private ToolStripStatusLabel pt_Mid_NULL_TSSLabel;

	private Panel panel1;

	private RadioButton P3_Accedinfo_Source2_radioButton;

	private Button Print_Button;

	private BindingSource pLU_TaxTypeBindingSource;

	private BindingSource classBindingSource;

	private BindingSource labelBindingSource1;

	private BindingSource barcodeBindingSource1;

	private BindingSource labelBindingSource2;

	private BindingSource barcodeBindingSource2;

	private Panel Device_Cxx_Panel;

	private RadioButton Device_C11_RadioButton;

	private RadioButton Device_C15_RadioButton;

	private RadioButton Device_A15_RadioButton;

	private Label Device_A15_Label;

	private Label Device_C11_Label;

	private GroupBox P1_Part7_groupBox;

	private CheckBox P1_P7_SingleQR_CheckBox;

	private RadioButton P1_P7_SumQR_RadioButton;

	private RadioButton P1_P7_SumEAN_RadioButton;

	private CheckBox P1_P7_NoLastEnter_CheckBox;

	private NumericUpDown P1_P7_QRVersion_NumericUpDown;

	private Label QRSize_Label;

	private Label QRVersion_Label;

	private RadioButton Device_A17_RadioButton;

	private Label Device_A17_Label;

	private Label Device_F_Label;

	private RadioButton Device_F_RadioButton;

	private DataGridViewTextBoxColumn pluidDataGridViewTextBoxColumn;

	private DataGridViewCheckBoxColumn validDataGridViewCheckBoxColumn;

	private DataGridViewTextBoxColumn nameDataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn unitidDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn priceDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn remarkDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn indexDataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn ps_ud_DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn pc_ud_DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn costDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn tareDataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn classidDataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn taxtypeDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn taxtextDataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn labelID1DataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn barT1DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn barF1DataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn labelID2DataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn barT2DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn barF2DataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn bitmapDataGridViewComboBoxColumn;

	private BindingSource bitmapBindingSource2;

	private DataGridViewTextBoxColumn text1DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn text2DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn text3DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn text4DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn text5DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn text6DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn text7DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn sspValue1DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn sspValue2DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn sspValue3DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn sspValue4DataGridViewTextBoxColumn;

	private CheckBox P5_BuyBack_A512_checkBox;

	public WizardForm()
	{
		InitializeComponent();
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "WizardForm");
	}

	private void Device_Changed(object sender, EventArgs e)
	{
		string text = Application.StartupPath + "\\Resources\\";
		Panel device_Axx_Display_Panel = Device_Axx_Display_Panel;
		bool enabled = (Device_Axx_Panel.Enabled = Device_A_RadioButton.Checked);
		device_Axx_Display_Panel.Enabled = enabled;
		Panel device_Cxx_Display_Panel = Device_Cxx_Display_Panel;
		bool enabled2 = (Device_Cxx_Panel.Enabled = Device_C_RadioButton.Checked);
		device_Cxx_Display_Panel.Enabled = enabled2;
		if (Device_B_RadioButton.Checked)
		{
			devicePictureBox.Image = new Bitmap(text + Device_B_Label.Text);
			ctSC.Device = "B";
		}
		else if (Device_C_RadioButton.Checked)
		{
			if (Device_C11_RadioButton.Checked)
			{
				Device_C11_RadioButton.Checked = true;
				devicePictureBox.Image = new Bitmap(text + Device_C11_Label.Text);
				ctSC.Device = "C11";
				Device_Cxx_4w_RadioButton.Enabled = true;
			}
			else
			{
				Device_C15_RadioButton.Checked = true;
				devicePictureBox.Image = new Bitmap(text + Device_C15_Label.Text);
				ctSC.Device = "C15";
				if (Device_Cxx_4w_RadioButton.Checked)
				{
					Device_Cxx_5w_RadioButton.Checked = true;
				}
				Device_Cxx_4w_RadioButton.Enabled = false;
			}
		}
		else if (Device_D_RadioButton.Checked)
		{
			devicePictureBox.Image = new Bitmap(text + Device_D_Label.Text);
			ctSC.Device = "D";
		}
		else if (Device_E_RadioButton.Checked)
		{
			devicePictureBox.Image = new Bitmap(text + Device_E_Label.Text);
			ctSC.Device = "E";
		}
		else if (Device_F_RadioButton.Checked)
		{
			devicePictureBox.Image = new Bitmap(text + Device_F_Label.Text);
			ctSC.Device = "F";
		}
		else if (Device_A_RadioButton.Checked)
		{
			if (Device_A08_RadioButton.Checked)
			{
				devicePictureBox.Image = new Bitmap(text + Device_A08_Label.Text);
				ctSC.Device = "A08";
				if (Device_Axx_np_RadioButton.Checked)
				{
					Device_Axx_4w_RadioButton.Checked = true;
				}
				Device_Axx_4w_RadioButton.Enabled = true;
				Device_Axx_np_RadioButton.Enabled = false;
			}
			else if (Device_A12_RadioButton.Checked)
			{
				Device_A12_RadioButton.Checked = true;
				devicePictureBox.Image = new Bitmap(text + Device_A12_Label.Text);
				ctSC.Device = "A12";
				Device_Axx_4w_RadioButton.Enabled = true;
				Device_Axx_np_RadioButton.Enabled = true;
			}
			else if (Device_A15_RadioButton.Checked)
			{
				Device_A15_RadioButton.Checked = true;
				devicePictureBox.Image = new Bitmap(text + Device_A15_Label.Text);
				ctSC.Device = "A15";
				if (Device_Axx_4w_RadioButton.Checked)
				{
					Device_Axx_5w_RadioButton.Checked = true;
				}
				Device_Axx_4w_RadioButton.Enabled = false;
				Device_Axx_np_RadioButton.Enabled = true;
			}
			else
			{
				Device_A17_RadioButton.Checked = true;
				devicePictureBox.Image = new Bitmap(text + Device_A17_Label.Text);
				ctSC.Device = "A17";
				Device_Axx_5w_RadioButton.Checked = true;
				Device_Axx_4w_RadioButton.Enabled = false;
				Device_Axx_np_RadioButton.Enabled = false;
			}
		}
		if (Device_Axx_5w_RadioButton.Checked)
		{
			ctSC.Device_A = "5w";
		}
		else if (Device_Axx_np_RadioButton.Checked)
		{
			ctSC.Device_A = "np";
		}
		else
		{
			ctSC.Device_A = "4w";
		}
		if (Device_Cxx_5w_RadioButton.Checked)
		{
			ctSC.Device_C = "5w";
		}
		else
		{
			ctSC.Device_C = "4w";
		}
	}

	private void OpMain_Changed(object sender, EventArgs e)
	{
		if (sender == OpMain_SCP_CheckBox && OpMain_SCP_CheckBox.Checked)
		{
			OpMain_PLU_CheckBox.Checked = true;
		}
		if (sender == OpMain_PLU_CheckBox && !OpMain_PLU_CheckBox.Checked)
		{
			OpMain_SCP_CheckBox.Checked = false;
		}
		if (OpMain_FirstConfig_radioButton.Checked)
		{
			ctSC.OpMain = "FirstConfig";
		}
		else if (OpMain_WorkData_radioButton.Checked)
		{
			ctSC.OpMain = "WorkData";
		}
		else if (OpMain_TMSout_radioButton.Checked)
		{
			ctSC.OpMain = "TMSout";
		}
		ctSC.OpMain_LabelBarcode = OpMain_LabelBarcode_CheckBox.Checked;
		ctSC.OpMain_Management = OpMain_Management_CheckBox.Checked;
		ctSC.OpMain_SaleOperation = OpMain_SaleOperation_CheckBox.Checked;
		ctSC.OpMain_UnitDisplay = OpMain_UnitDisplay_CheckBox.Checked;
		ctSC.OpMain_PLU = OpMain_PLU_CheckBox.Checked;
		ctSC.OpMain_ShortcutKey = OpMain_SCP_CheckBox.Checked;
		if (OpMain_FirstConfig_radioButton.Checked && !OpMain_LabelBarcode_CheckBox.Checked && !OpMain_Management_CheckBox.Checked && !OpMain_SaleOperation_CheckBox.Checked && !OpMain_UnitDisplay_CheckBox.Checked && !OpMain_PLU_CheckBox.Checked && !OpMain_SCP_CheckBox.Checked)
		{
			Next_button.Enabled = false;
		}
		else
		{
			Next_button.Enabled = true;
		}
	}

	private void Mode_Changed(object sender, EventArgs e)
	{
		Mode_OneItemOnly_checkBox.Enabled = Mode_LabelPrint_RadioButton.Checked;
		Mode_PrintDirect_checkBox.Enabled = Mode_OneItemOnly_checkBox.Enabled && Mode_OneItemOnly_checkBox.Checked;
		Mode_ScanInternalBarcode_checkBox.Enabled = Mode_CashRegister_RadioButton.Checked;
		if (sender == Mode_LabelPrint_RadioButton || sender == Mode_CashRegister_RadioButton)
		{
			Mode_GapPapper_RadioButton.Checked = Mode_LabelPrint_RadioButton.Checked;
			Mode_PlainPapper_RadioButton.Checked = Mode_CashRegister_RadioButton.Checked;
		}
		if (ctSC != null)
		{
			ctSC.Mode_Gray = (int)Mode_Gray_numericUpDown.Value;
			ctSC.Mode_Prepack = Mode_LabelPrint_RadioButton.Checked;
			ctSC.Mode_OneItemOnly = Mode_OneItemOnly_checkBox.Checked;
			ctSC.Mode_PrintDirect = Mode_PrintDirect_checkBox.Checked;
			ctSC.Mode_GapPaper = Mode_GapPapper_RadioButton.Checked;
			ctSC.Mode_ScanInternalBarcode = Mode_ScanInternalBarcode_checkBox.Checked;
			if (Mode_PlainPaper57_RadioButton.Checked)
			{
				ctSC.Mode_PlainPaperType = 57;
			}
			else if (Mode_PlainPaper60_RadioButton.Checked)
			{
				ctSC.Mode_PlainPaperType = 60;
			}
			else if (Mode_PlainPaper40_RadioButton.Checked)
			{
				ctSC.Mode_PlainPaperType = 40;
			}
			else
			{
				ctSC.Mode_PlainPaperType = 0;
			}
			if (Mode_GapPaper60x40_RadioButton.Checked)
			{
				ctSC.Mode_GapPaperType = 6040;
			}
			else if (Mode_GapPaper40x30_RadioButton.Checked)
			{
				ctSC.Mode_GapPaperType = 4030;
			}
			else if (Mode_GapPaper30x40_RadioButton.Checked)
			{
				ctSC.Mode_GapPaperType = 3040;
			}
			else if (Mode_GapPaper60x30_RadioButton.Checked)
			{
				ctSC.Mode_GapPaperType = 6030;
			}
			else
			{
				ctSC.Mode_GapPaperType = 0;
			}
		}
		Mode_GapPapper_Panel.Visible = Mode_GapPapper_RadioButton.Checked;
		Mode_PlainPapper_Panel.Visible = Mode_PlainPapper_RadioButton.Checked;
	}

	private char[] GetBarcode_Single()
	{
		char[] array = "A000A000A000A000A000A000".ToCharArray(0, 24);
		if (P1_Type2551_radioButton.Checked)
		{
			array[1] = '2';
			array[5] = '5';
			array[9] = '5';
		}
		else if (P1_Type2641_radioButton.Checked)
		{
			array[1] = '2';
			array[5] = '6';
			array[9] = '4';
		}
		else if (P1_Type2461_radioButton.Checked)
		{
			array[1] = '2';
			array[5] = '4';
			array[9] = '6';
		}
		else if (P1_Type1651_radioButton.Checked)
		{
			array[1] = '1';
			array[5] = '6';
			array[9] = '5';
		}
		else if (P1_Type1561_radioButton.Checked)
		{
			array[1] = '1';
			array[5] = '5';
			array[9] = '6';
		}
		else if (P1_Type25551_radioButton.Checked)
		{
			array[1] = '2';
			array[5] = '5';
			array[9] = '5';
			array[13] = '5';
		}
		else if (P1_Type26451_radioButton.Checked)
		{
			array[1] = '2';
			array[5] = '6';
			array[9] = '4';
			array[13] = '5';
		}
		else if (P1_Type24651_radioButton.Checked)
		{
			array[1] = '2';
			array[5] = '4';
			array[9] = '6';
			array[13] = '5';
		}
		else if (P1_Type16551_radioButton.Checked)
		{
			array[1] = '1';
			array[5] = '6';
			array[9] = '5';
			array[13] = '5';
		}
		else if (P1_Type15651_radioButton.Checked)
		{
			array[1] = '1';
			array[5] = '5';
			array[9] = '6';
			array[13] = '5';
		}
		array[0] = 'B';
		array[3] = '1';
		if (P1_P2ItemCode_radioButton.Checked)
		{
			array[4] = 'F';
			array[7] = '1';
		}
		else if (P1_P2PLUNumber_radioButton.Checked)
		{
			array[4] = 'E';
		}
		else
		{
			array[4] = 'C';
		}
		if (P1_P3Amount_radioButton.Checked)
		{
			array[8] = 'J';
			if (array[13] != '0')
			{
				array[12] = 'K';
			}
		}
		else
		{
			array[8] = 'K';
			if (array[13] != '0')
			{
				array[12] = 'J';
			}
		}
		if (P1_Part4_groupBox.Visible)
		{
			if (P1_P4Amount_radioButton.Checked)
			{
				array[12] = 'J';
			}
			else
			{
				array[12] = 'K';
			}
		}
		return array;
	}

	private string GetBarcode_SumQR(char[] ct)
	{
		string text = new string(ct, 0, (ct[12] == 'A') ? 12 : 16);
		if ((ctSC.Barcode_CR_QR_Para & 2) == 0)
		{
			return "=001" + text + "=100=200=000";
		}
		return "=001" + text + "=100=002=200=000";
	}

	private string GetBarcode_SumEAN(char[] ct)
	{
		if (!ctSC.Barcode_CR_Flag_SumUsingItem)
		{
			ct[1] += (char)(ushort)(ct[5] - 48);
			ct[5] = '0';
			ct[4] = 'A';
		}
		if (ct[8] == 'K')
		{
			ct[8] = 'L';
		}
		if (ct[12] == 'K')
		{
			ct[12] = 'L';
		}
		if (ct[8] == 'J')
		{
			if (P1_P3_4TotalPcs_radioButton.Checked)
			{
				ct[8] = 'M';
			}
			else
			{
				ct[8] = 'N';
			}
		}
		else if (ct[12] == 'J')
		{
			if (P1_P3_4TotalPcs_radioButton.Checked)
			{
				ct[12] = 'M';
			}
			else
			{
				ct[12] = 'N';
			}
		}
		return new string(ct);
	}

	public void XMLSerialize()
	{
		StringWriter stringWriter = new StringWriter();
		stringWriter.WriteLine();
		stringWriter.WriteLine("DWL\tTMS\t");
		if (ctSC.wcStep[2])
		{
			if (ctSC.Mode_Prepack)
			{
				if (ctSC.Mode_OneItemOnly)
				{
					if (ctSC.Mode_PrintDirect)
					{
						stringWriter.WriteLine("TMS\t250\t1\t");
					}
					else
					{
						stringWriter.WriteLine("TMS\t250\t1\t");
						stringWriter.WriteLine("END\tTMS\t");
						stringWriter.WriteLine("DWL\tTMS\t");
						stringWriter.WriteLine("TMS\t250\t2\t");
					}
				}
				else
				{
					stringWriter.WriteLine("TMS\t250\t0\t");
					stringWriter.WriteLine("TMS\t5\t{0}\t", ctSC.PT_SumLabel);
				}
				stringWriter.WriteLine("TMS\t0\t{0}\t", ctSC.PT_ItemLabel);
			}
			else
			{
				stringWriter.WriteLine("TMS\t250\t0\t");
				stringWriter.WriteLine("TMS\t0\t{0}\t", ctSC.PT_Receipt);
				stringWriter.WriteLine("TMS\t5\t{0}\t", ctSC.PT_Receipt);
			}
			if (ctSC.Mode_GapPaper)
			{
				stringWriter.WriteLine("TMS\t21\t1\t");
			}
			else
			{
				stringWriter.WriteLine("TMS\t21\t0\t");
			}
			stringWriter.WriteLine("TMS\t22\t{0}\t", ctSC.Mode_Gray);
			stringWriter.WriteLine("TMS\t23\t{0}\t", ctSC.Mode_Gray);
		}
		if (ctSC.wcStep[7])
		{
			stringWriter.WriteLine("TMS\t138\t{0}\t", ctSC.MG_AdminInCharge);
			stringWriter.WriteLine("TMS\t110\t{0}\t", (ctSC.MG_UnitPriceChangeForbidden ? 1 : 0) + (ctSC.MG_GrandTotalChangeForbidden ? 2 : 0));
			stringWriter.WriteLine("TMS\t118\t{0}\t", ctSC.MG_AccuClear);
			stringWriter.WriteLine("TMS\t283\t{0}\t", ctSC.MG_Unconfirm);
			stringWriter.WriteLine("TMS\t69\t{0}\t", ctSC.MG_ZeroBack);
		}
		if (ctSC.wcStep[8])
		{
			stringWriter.WriteLine("TMS\t83\t{0}\t", ctSC.MG_PriceFProg);
			stringWriter.WriteLine("TMS\t74\t{0}\t", ctSC.MG_BuyBack);
			stringWriter.WriteLine("TMS\t131\t{0}\t", ctSC.MG_ZeroReturn);
			stringWriter.WriteLine("TMS\t282\t{0}\t", ctSC.MG_Payments);
			stringWriter.WriteLine("TMS\t279\t{0}\t", ctSC.MG_Hangup);
		}
		if (ctSC.wcStep[9])
		{
			stringWriter.WriteLine("TMS\t202\t{0}\t", ctSC.MISC_UPPoint);
			stringWriter.WriteLine("TMS\t203\t{0}\t", ctSC.MISC_TPPoint);
			stringWriter.WriteLine("TMS\t100\t{0}\t", ctSC.MISC_STRounding);
			stringWriter.WriteLine("TMS\t101\t{0}\t", ctSC.MISC_TTRounding);
			stringWriter.WriteLine("TMS\t185\t{0}\t", ctSC.MISC_PrintUnit_Amount ? 1 : 0);
			stringWriter.WriteLine("TMS\t186\t{0}\t", ctSC.MISC_PrintUnit_UPrice ? 1 : 0);
			stringWriter.WriteLine("TMS\t187\t{0}\t", ctSC.MISC_PrintUnit_Money ? 1 : 0);
			stringWriter.WriteLine("END\tTMS\t");
			stringWriter.WriteLine("DWL\tTMT\t");
			stringWriter.WriteLine("TMT\t{0}\t{1}\t", 2, ctSC.MISC_Prefix);
			stringWriter.WriteLine("TMT\t{0}\t{1}\t", 3, ctSC.MISC_Suffix);
			stringWriter.WriteLine("END\tTMT\t");
			stringWriter.WriteLine("DWL\tTMS\t");
		}
		if (ctSC.wcStep[10])
		{
			stringWriter.WriteLine("TMS\t190\t{0}\t", ctSC.MISC_PLUInfo_Font);
			stringWriter.WriteLine("TMS\t194\t{0}\t", ctSC.MISC_PLUInfo_S1);
			stringWriter.WriteLine("TMS\t195\t{0}\t", ctSC.MISC_PLUInfo_S2);
			stringWriter.WriteLine("TMS\t191\t{0}\t", ctSC.MISC_IdleInfo_Font);
			stringWriter.WriteLine("TMS\t193\t{0}\t", ctSC.MISC_AccuInfo_S);
			if (ctSC.MISC_IdleInfo_S == 0)
			{
				stringWriter.WriteLine("TMS\t192\t{0}\t", 0);
			}
			if (ctSC.MISC_IdleInfo_S == 1)
			{
				stringWriter.WriteLine("TMS\t192\t{0}\t", 4);
			}
			if (ctSC.MISC_IdleInfo_S == 2)
			{
				stringWriter.WriteLine("TMS\t192\t{0}\t", 5);
			}
			if (ctSC.MISC_IdleInfo_S == 3)
			{
				stringWriter.WriteLine("TMS\t192\t{0}\t", 16);
				stringWriter.WriteLine("END\tTMS\t");
				stringWriter.WriteLine("DWL\tTMT\t");
				stringWriter.WriteLine("TMT\t{0}\t{1}\t", 12, ctSC.MISC_IdleInfo_SS);
				stringWriter.WriteLine("END\tTMT\t");
				stringWriter.WriteLine("DWL\tTMS\t");
			}
		}
		if (ctSC.Barcode_ED)
		{
			if (ctSC.Barcode_Main == 0)
			{
				stringWriter.WriteLine("TMS\t139\t{0}\t", ctSC.Barcode_CR_CheckType);
				stringWriter.WriteLine("TMS\t1\t{0}\t", 28);
				stringWriter.WriteLine("TMS\t2\t{0}\t", ctSC.Barcode_CR_Flag_Item);
				if (ctSC.Barcode_CR_Decimal_Money_Use)
				{
					stringWriter.WriteLine("TMS\t209\t{0}\t", ctSC.Barcode_CR_Decimal_Money);
				}
				if (ctSC.Barcode_CR_Decimal_Weight_Use)
				{
					stringWriter.WriteLine("TMS\t208\t{0}\t", ctSC.Barcode_CR_Decimal_Weight);
				}
				if (ctSC.Barcode_CR_Decimal_Pcs_Use)
				{
					stringWriter.WriteLine("TMS\t196\t{0}\t", ctSC.Barcode_CR_Decimal_Pcs);
				}
				if (!ctSC.Mode_Prepack)
				{
					stringWriter.WriteLine("TMS\t6\t{0}\t", 28);
					stringWriter.WriteLine("TMS\t7\t{0}\t", ctSC.Barcode_CR_Flag_Item);
				}
				else if (!ctSC.Mode_OneItemOnly)
				{
					stringWriter.WriteLine("TMS\t6\t{0}\t", 29);
					if (ctSC.Barcode_CR_QR)
					{
						stringWriter.WriteLine("TMS\t7\t{0}\t", ctSC.Barcode_CR_Flag_Item);
						stringWriter.WriteLine("TMS\t456\t{0}\t", ctSC.Barcode_CR_QR_Version);
					}
					else if (ctSC.Barcode_CR_Flag_SumUsingItem)
					{
						stringWriter.WriteLine("TMS\t7\t{0}\t", ctSC.Barcode_CR_Flag_Item);
					}
					else
					{
						stringWriter.WriteLine("TMS\t7\t{0}\t", ctSC.Barcode_CR_Flag_Sum);
					}
				}
			}
			else
			{
				stringWriter.WriteLine("TMS\t1\t{0}\t", 28);
				stringWriter.WriteLine("TMS\t6\t{0}\t", 28);
			}
		}
		stringWriter.WriteLine("END\tTMS\t");
		if (ctSC.Barcode_ED)
		{
			stringWriter.WriteLine("DWL\tBAR\t");
			barcodeTableAdapter.Fill(eCSDataSet.Barcode);
			if (ctSC.Barcode_Main == 0)
			{
				ECSDataSet.BarcodeRow barcodeRow = eCSDataSet.Barcode.FindByBarID(28);
				if (barcodeRow == null)
				{
					barcodeRow = eCSDataSet.Barcode.NewBarcodeRow();
					barcodeRow.BarID = 28;
					eCSDataSet.Barcode.AddBarcodeRow(barcodeRow);
				}
				barcodeRow.Name = "QS-Item";
				barcodeRow.Format = 0;
				barcodeRow.Check = 0;
				barcodeRow.Num1 = (int)P1_P2Const_numericUpDown.Value;
				barcodeRow.Num2 = 0;
				char[] barcode_Single = GetBarcode_Single();
				if (ctSC.Barcode_CR_QR)
				{
					if ((ctSC.Barcode_CR_QR_Para & 1) == 0)
					{
						barcodeRow.TChar = new string(barcode_Single);
					}
					else
					{
						barcodeRow.Format = 11;
						barcodeRow.TChar = GetBarcode_SumQR(barcode_Single);
					}
				}
				else
				{
					barcodeRow.TChar = new string(barcode_Single);
				}
				barcodeRow.EndEdit();
				if (ctSC.Mode_Prepack && !ctSC.Mode_OneItemOnly)
				{
					ECSDataSet.BarcodeRow barcodeRow2 = eCSDataSet.Barcode.FindByBarID(29);
					if (barcodeRow2 == null)
					{
						barcodeRow2 = eCSDataSet.Barcode.NewBarcodeRow();
						eCSDataSet.Barcode.AddBarcodeRow(barcodeRow2);
					}
					object[] itemArray = barcodeRow.ItemArray;
					itemArray[0] = 29;
					barcodeRow2.ItemArray = itemArray;
					barcodeRow2.Name = "QS-Sum";
					if (ctSC.Barcode_CR_QR)
					{
						barcodeRow2.Format = 11;
						if ((ctSC.Barcode_CR_QR_Para & 1) == 0)
						{
							barcodeRow2.TChar = GetBarcode_SumQR(barcode_Single);
						}
						else
						{
							barcodeRow2.TChar = barcodeRow.TChar;
						}
					}
					else
					{
						barcodeRow2.TChar = GetBarcode_SumEAN(barcode_Single);
					}
					barcodeRow2.EndEdit();
				}
			}
			else if (ctSC.Barcode_Main == 1)
			{
				ECSDataSet.BarcodeRow barcodeRow3 = eCSDataSet.Barcode.FindByBarID(28);
				if (barcodeRow3 == null)
				{
					barcodeRow3 = eCSDataSet.Barcode.NewBarcodeRow();
					barcodeRow3.BarID = 28;
					eCSDataSet.Barcode.AddBarcodeRow(barcodeRow3);
				}
				barcodeRow3.Name = "QS-Item";
				barcodeRow3.Format = ctSC.Barcode_SP_BType;
				barcodeRow3.Check = ((!ctSC.Barcode_SP_TryAddCheckDigit) ? 3 : 0);
				barcodeRow3.Num1 = 0;
				barcodeRow3.Num2 = 0;
				if (ctSC.Barcode_SP_Type == 0)
				{
					barcodeRow3.TChar = "@" + ctSC.Barcode_SP_PLUInfo.ToString("000") + "A000A000A000A000A000";
				}
				else
				{
					barcodeRow3.TChar = ">" + ctSC.Barcode_SP_Constant + "\vA000A000A000A000A000";
				}
				barcodeRow3.EndEdit();
			}
			else
			{
				ECSDataSet.BarcodeRow barcodeRow4 = eCSDataSet.Barcode.FindByBarID(28);
				if (barcodeRow4 == null)
				{
					barcodeRow4 = eCSDataSet.Barcode.NewBarcodeRow();
					barcodeRow4.BarID = 28;
					eCSDataSet.Barcode.AddBarcodeRow(barcodeRow4);
				}
				barcodeRow4.Name = "QS-Item";
				barcodeRow4.Format = ctSC.Barcode_ME_BType;
				barcodeRow4.Check = ((!ctSC.Barcode_ME_TryAddCheckDigit) ? 3 : 0);
				barcodeRow4.Num1 = 0;
				barcodeRow4.Num2 = 0;
				barcodeRow4.TChar = ctSC.Barcode_ME_Source;
				barcodeRow4.EndEdit();
			}
			barcodeTableAdapter.Update(eCSDataSet.Barcode);
			ECSDataSet.BarcodeRow barcodeRow5 = eCSDataSet.Barcode.FindByBarID(28);
			stringWriter.WriteLine("BAR\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t", barcodeRow5.BarID, barcodeRow5.Name, barcodeRow5.Format, barcodeRow5.Check, barcodeRow5.Num1, barcodeRow5.Num2, barcodeRow5.TChar);
			if (ctSC.Barcode_Main == 0 && ctSC.Mode_Prepack && !ctSC.Mode_OneItemOnly)
			{
				barcodeRow5 = eCSDataSet.Barcode.FindByBarID(29);
				stringWriter.WriteLine("BAR\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t", barcodeRow5.BarID, barcodeRow5.Name, barcodeRow5.Format, barcodeRow5.Check, barcodeRow5.Num1, barcodeRow5.Num2, barcodeRow5.TChar);
			}
			stringWriter.WriteLine("END\tBAR\t");
		}
		if (ctSC.wcStep[7] && (ctSC.PW_Admin_Sel || ctSC.PW_Sale_Sel || ctSC.PW_Prog_Sel || ctSC.PW_Account_Sel || ctSC.PW_Drawer_Sel || ctSC.PW_PriceFProg_Sel))
		{
			stringWriter.WriteLine("DWL\tPAS\t");
			if (ctSC.PW_Admin_Sel)
			{
				stringWriter.WriteLine("PAS\t0\t{0}\t", ctSC.PW_Admin_String);
			}
			if (ctSC.PW_Sale_Sel)
			{
				stringWriter.WriteLine("PAS\t1\t{0}\t", ctSC.PW_Sale_String);
			}
			if (ctSC.PW_Prog_Sel)
			{
				stringWriter.WriteLine("PAS\t2\t{0}\t", ctSC.PW_Prog_String);
			}
			if (ctSC.PW_Account_Sel)
			{
				stringWriter.WriteLine("PAS\t3\t{0}\t", ctSC.PW_Account_String);
			}
			if (ctSC.PW_Drawer_Sel)
			{
				stringWriter.WriteLine("PAS\t4\t{0}\t", ctSC.PW_Drawer_String);
			}
			if (ctSC.PW_PriceFProg_Sel)
			{
				stringWriter.WriteLine("PAS\t5\t{0}\t", ctSC.PW_PriceFProg_String);
			}
			stringWriter.WriteLine("END\tPAS\t");
		}
		if (ctSC.wcStep[2])
		{
			stringWriter.WriteLine("DWL\tTMT\t");
			for (int i = 0; i < ctSC.PT_GlobalText_ED.Length; i++)
			{
				if (ctSC.PT_GlobalText_ED[i])
				{
					stringWriter.WriteLine("TMT\t{0}\t{1}\t", i, ctSC.PT_GlobalText[i]);
				}
			}
			stringWriter.WriteLine("END\tTMT\t");
		}
		Program.sWizard = (ctSC.TMSout = stringWriter.ToString());
		IFormatter formatter = new BinaryFormatter();
		Stream stream = new FileStream(Application.StartupPath + "\\Wizard.BIN", FileMode.Create, FileAccess.Write, FileShare.None);
		formatter.Serialize(stream, ctSC);
		stream.Close();
	}

	public void GetAdminInCharge(int AdminInCharge)
	{
		Reprint_CheckBox.Checked = (AdminInCharge & 1) != 0;
		Preprint_CheckBox.Checked = (AdminInCharge & 2) != 0;
		TSaleWT_CheckBox.Checked = (AdminInCharge & 4) != 0;
		TSaleCT_CheckBox.Checked = (AdminInCharge & 8) != 0;
		ItemQuit_CheckBox.Checked = (AdminInCharge & 0x10) != 0;
		Amend_CheckBox.Checked = (AdminInCharge & 0x20) != 0;
		HangupWrite_CheckBox.Checked = (AdminInCharge & 0x40) != 0;
		HangupRead_CheckBox.Checked = (AdminInCharge & 0x80) != 0;
		FProgPrice_CheckBox.Checked = (AdminInCharge & 0x100) != 0;
		BuyBack_CheckBox.Checked = (AdminInCharge & 0x200) != 0;
		Drawer_CheckBox.Checked = (AdminInCharge & 0x400) != 0;
		IllegalReboot_CheckBox.Checked = (AdminInCharge & 0x800) != 0;
	}

	private void reset_Button_Click(object sender, EventArgs e)
	{
		File.Delete(Application.StartupPath + "\\Wizard.BIN");
		XMLDeserialize();
	}

	public void XMLDeserialize()
	{
		SaveConfig saveConfig;
		try
		{
			IFormatter formatter = new BinaryFormatter();
			Stream stream = new FileStream(Application.StartupPath + "\\Wizard.BIN", FileMode.Open, FileAccess.Read, FileShare.Read);
			saveConfig = (SaveConfig)formatter.Deserialize(stream);
			stream.Close();
			if (saveConfig.ValidCheck != Program.VALIDCHECK_Wizard)
			{
				throw new Exception();
			}
			if (saveConfig.PT_GlobalText == null || saveConfig.PT_GlobalText.Length != 28)
			{
				throw new Exception();
			}
		}
		catch (Exception)
		{
			saveConfig = new SaveConfig();
			saveConfig.PT_Bitmap_Used = false;
			saveConfig.PT_GlobalText = new string[28];
			saveConfig.PT_GlobalText_ED = new bool[28];
			string[] array = Program.GetLang("pw_Z_ConfigWizard_DeviceMenu").Split('|');
			if (array.Length >= 3)
			{
				saveConfig.Device = array[1];
				saveConfig.Device_A = (saveConfig.Device_C = array[2]);
			}
			else
			{
				saveConfig.Device = "A12";
				saveConfig.Device_A = (saveConfig.Device_C = "4w");
			}
			saveConfig.OpMain = "FirstConfig";
			saveConfig.wcStep = null;
			saveConfig.OpMain_LabelBarcode = true;
			saveConfig.OpMain_Management = false;
			saveConfig.OpMain_SaleOperation = false;
			saveConfig.OpMain_UnitDisplay = false;
			saveConfig.OpMain_PLU = true;
			saveConfig.OpMain_ShortcutKey = true;
			saveConfig.Mode_Gray = 7;
			saveConfig.Mode_Prepack = true;
			saveConfig.Mode_OneItemOnly = false;
			saveConfig.Mode_PrintDirect = true;
			saveConfig.Mode_GapPaper = true;
			saveConfig.Mode_ScanInternalBarcode = false;
			saveConfig.Mode_GapPaperType = 6040;
			saveConfig.Mode_PlainPaperType = 57;
			saveConfig.Barcode_Main = 0;
			saveConfig.Barcode_CR_Type = 2551;
			saveConfig.Barcode_CR_Flag_Item = 20;
			saveConfig.Barcode_CR_Flag_Sum = 2099999;
			saveConfig.Barcode_CR_Flag_SumUsingItem = true;
			saveConfig.Barcode_CR_Item_P2 = -1;
			saveConfig.Barcode_CR_Item_P3_Weight = false;
			saveConfig.Barcode_CR_CheckType = 0;
			saveConfig.Barcode_CR_Sum_UsePcsAsAmount = true;
			saveConfig.Barcode_CR_QR = true;
			saveConfig.Barcode_CR_QR_Para = 0;
			saveConfig.Barcode_CR_QR_Version = 5;
			saveConfig.Barcode_SP_Type = 0;
			saveConfig.Barcode_SP_PLUInfo = 0;
			saveConfig.Barcode_SP_Constant = "";
			saveConfig.Barcode_SP_BType = 0;
			saveConfig.Barcode_SP_TryAddCheckDigit = false;
			saveConfig.Barcode_CR_Decimal_Money_Use = true;
			saveConfig.Barcode_CR_Decimal_Weight_Use = false;
			saveConfig.Barcode_CR_Decimal_Pcs_Use = false;
			saveConfig.Barcode_CR_Decimal_Weight = 3;
			saveConfig.Barcode_CR_Decimal_Pcs = 3;
			saveConfig.Barcode_CR_Decimal_Money = 2;
			saveConfig.Barcode_ME_BType = 0;
			saveConfig.Barcode_ME_TryAddCheckDigit = true;
			saveConfig.Barcode_ME_Source = "A000A000A000A000A000A000";
			saveConfig.SCP_ScaleID = Settings.Default.ScFile_ScaleID;
			saveConfig.SCP_Page = Settings.Default.defaultSCP_Page;
			saveConfig.SCP_Font = Settings.Default.faceFont;
			saveConfig.PLU_Remark = true;
			saveConfig.PLU_Index = true;
			saveConfig.PLU_PS_UD = true;
			saveConfig.PLU_Cost = false;
			saveConfig.PLU_Tare = false;
			saveConfig.PLU_Class = false;
			saveConfig.PLU_Tax = false;
			saveConfig.PLU_Text1 = (saveConfig.PLU_Text2 = (saveConfig.PLU_Text3 = (saveConfig.PLU_Text4 = (saveConfig.PLU_Text5 = (saveConfig.PLU_Text6 = (saveConfig.PLU_Text7 = false))))));
			if (Program.LangSocket.Contains("Ramuza"))
			{
				saveConfig.PLU_Text6 = true;
			}
			saveConfig.PW_Admin_Sel = (saveConfig.PW_Sale_Sel = (saveConfig.PW_Prog_Sel = (saveConfig.PW_Account_Sel = (saveConfig.PW_Drawer_Sel = (saveConfig.PW_PriceFProg_Sel = false)))));
			saveConfig.PW_Admin_String = "200806";
			saveConfig.PW_Sale_String = (saveConfig.PW_Prog_String = (saveConfig.PW_Account_String = (saveConfig.PW_Drawer_String = (saveConfig.PW_PriceFProg_String = ""))));
			saveConfig.MG_AdminInCharge = 0;
			saveConfig.MG_GrandTotalChangeForbidden = false;
			saveConfig.MG_UnitPriceChangeForbidden = false;
			saveConfig.MG_Unconfirm = 1;
			saveConfig.MG_ZeroBack = Program.ParseInt(Program.GetLang("pw_ZeroReturnForWeightSale_Value"), 1);
			saveConfig.MG_AccuClear = 3;
			saveConfig.MG_xxxRight = "Full";
			saveConfig.MG_PriceFProg = 1;
			saveConfig.MG_ZeroReturn = 1;
			saveConfig.MG_BuyBack = 0;
			saveConfig.MG_Payments = 0;
			saveConfig.MG_Hangup = 0;
			saveConfig.MISC_UPPoint = 2;
			saveConfig.MISC_TPPoint = 2;
			saveConfig.MISC_STRounding = 0;
			saveConfig.MISC_TTRounding = 0;
			saveConfig.MISC_Prefix = eCSDataSet.String.FindByStringID(2).Value;
			saveConfig.MISC_Suffix = eCSDataSet.String.FindByStringID(3).Value;
			saveConfig.MISC_PrintUnit_Amount = (saveConfig.MISC_PrintUnit_UPrice = (saveConfig.MISC_PrintUnit_Money = false));
			saveConfig.MISC_PLUInfo_Font = 0;
			saveConfig.MISC_PLUInfo_S1 = 0;
			saveConfig.MISC_PLUInfo_S2 = 1;
			saveConfig.MISC_IdleInfo_Font = 1;
			saveConfig.MISC_IdleInfo_S = 0;
			saveConfig.MISC_IdleInfo_SS = "";
			saveConfig.MISC_AccuInfo_S = 0;
			for (int i = 0; i < 28; i++)
			{
				ECSDataSet.StringRow stringRow = eCSDataSet.String.FindByStringID(i);
				if (stringRow != null)
				{
					saveConfig.PT_GlobalText[i] = stringRow.Value;
				}
			}
			saveConfig.ValidCheck = Program.VALIDCHECK_Wizard;
		}
		_ = Application.StartupPath + "\\Resources\\";
		if (saveConfig.Device == "B")
		{
			Device_B_RadioButton.Checked = true;
		}
		else if (saveConfig.Device == "C11")
		{
			RadioButton device_C11_RadioButton = Device_C11_RadioButton;
			bool flag = (Device_C_RadioButton.Checked = true);
			device_C11_RadioButton.Checked = flag;
		}
		else if (saveConfig.Device == "C15")
		{
			RadioButton device_C15_RadioButton = Device_C15_RadioButton;
			bool flag3 = (Device_C_RadioButton.Checked = true);
			device_C15_RadioButton.Checked = flag3;
		}
		else if (saveConfig.Device == "D")
		{
			Device_D_RadioButton.Checked = true;
		}
		else if (saveConfig.Device == "E")
		{
			Device_E_RadioButton.Checked = true;
		}
		else if (saveConfig.Device == "F")
		{
			Device_F_RadioButton.Checked = true;
		}
		else if (saveConfig.Device == "A08")
		{
			RadioButton device_A08_RadioButton = Device_A08_RadioButton;
			bool flag5 = (Device_A_RadioButton.Checked = true);
			device_A08_RadioButton.Checked = flag5;
		}
		else if (saveConfig.Device == "A12")
		{
			RadioButton device_A12_RadioButton = Device_A12_RadioButton;
			bool flag7 = (Device_A_RadioButton.Checked = true);
			device_A12_RadioButton.Checked = flag7;
		}
		else if (saveConfig.Device == "A15")
		{
			RadioButton device_A15_RadioButton = Device_A15_RadioButton;
			bool flag9 = (Device_A_RadioButton.Checked = true);
			device_A15_RadioButton.Checked = flag9;
		}
		else if (saveConfig.Device == "A17")
		{
			RadioButton device_A17_RadioButton = Device_A17_RadioButton;
			bool flag11 = (Device_A_RadioButton.Checked = true);
			device_A17_RadioButton.Checked = flag11;
		}
		if (saveConfig.Device_A == "5w")
		{
			Device_Axx_5w_RadioButton.Checked = true;
		}
		else if (saveConfig.Device_A == "np")
		{
			Device_Axx_np_RadioButton.Checked = true;
		}
		else if (saveConfig.Device_A == "4w")
		{
			Device_Axx_4w_RadioButton.Checked = true;
		}
		if (saveConfig.Device_C == "5w")
		{
			Device_Cxx_5w_RadioButton.Checked = true;
		}
		else if (saveConfig.Device_C == "4w")
		{
			Device_Cxx_4w_RadioButton.Checked = true;
		}
		if (saveConfig.OpMain == "FirstConfig")
		{
			OpMain_FirstConfig_radioButton.Checked = true;
		}
		else if (saveConfig.OpMain == "WorkData")
		{
			OpMain_WorkData_radioButton.Checked = true;
		}
		else if (saveConfig.OpMain == "TMSout")
		{
			OpMain_TMSout_radioButton.Checked = true;
		}
		if (saveConfig.TMSout == null)
		{
			OpMain_FirstConfig_radioButton.Checked = true;
			RadioButton opMain_WorkData_radioButton = OpMain_WorkData_radioButton;
			bool enabled = (OpMain_TMSout_radioButton.Enabled = false);
			opMain_WorkData_radioButton.Enabled = enabled;
		}
		OpMain_LabelBarcode_CheckBox.Checked = saveConfig.OpMain_LabelBarcode;
		OpMain_Management_CheckBox.Checked = saveConfig.OpMain_Management;
		OpMain_SaleOperation_CheckBox.Checked = saveConfig.OpMain_SaleOperation;
		OpMain_UnitDisplay_CheckBox.Checked = saveConfig.OpMain_UnitDisplay;
		OpMain_PLU_CheckBox.Checked = saveConfig.OpMain_PLU;
		OpMain_SCP_CheckBox.Checked = saveConfig.OpMain_ShortcutKey;
		Mode_GapPaper0_RadioButton.Checked = saveConfig.Mode_GapPaperType == 0;
		Mode_GapPaper60x40_RadioButton.Checked = saveConfig.Mode_GapPaperType == 6040;
		Mode_GapPaper40x30_RadioButton.Checked = saveConfig.Mode_GapPaperType == 4030;
		Mode_GapPaper60x30_RadioButton.Checked = saveConfig.Mode_GapPaperType == 6030;
		Mode_GapPaper30x40_RadioButton.Checked = saveConfig.Mode_GapPaperType == 3040;
		Mode_PlainPaper0_RadioButton.Checked = saveConfig.Mode_PlainPaperType == 0;
		Mode_PlainPaper57_RadioButton.Checked = saveConfig.Mode_PlainPaperType == 57;
		Mode_PlainPaper40_RadioButton.Checked = saveConfig.Mode_PlainPaperType == 40;
		Mode_PlainPaper60_RadioButton.Checked = saveConfig.Mode_PlainPaperType == 60;
		Mode_Gray_numericUpDown.Value = saveConfig.Mode_Gray;
		Mode_LabelPrint_RadioButton.Checked = saveConfig.Mode_Prepack;
		Mode_CashRegister_RadioButton.Checked = !saveConfig.Mode_Prepack;
		Mode_OneItemOnly_checkBox.Checked = saveConfig.Mode_OneItemOnly;
		Mode_ScanInternalBarcode_checkBox.Checked = saveConfig.Mode_ScanInternalBarcode;
		Mode_PrintDirect_checkBox.Checked = saveConfig.Mode_PrintDirect;
		Mode_GapPapper_RadioButton.Checked = saveConfig.Mode_GapPaper;
		Mode_PlainPapper_RadioButton.Checked = !saveConfig.Mode_GapPaper;
		if (saveConfig.Barcode_Main == 0)
		{
			barcode_CashRegister_RadioButton.Checked = true;
		}
		else if (saveConfig.Barcode_Main == 1)
		{
			barcode_Special_RadioButton.Checked = true;
		}
		else if (saveConfig.Barcode_Main == 2)
		{
			barcode_ManualEdit_RadioButton.Checked = true;
		}
		Barcode_CR_Type_SetInt(saveConfig.Barcode_CR_Type);
		P1_P1_ItemFlag_numericUpDown.Value = saveConfig.Barcode_CR_Flag_Item;
		P1_P1_2SumFlag_numericUpDown.Value = saveConfig.Barcode_CR_Flag_Sum;
		P1_Part1_2Sum_UseItem_CheckBox.Checked = saveConfig.Barcode_CR_Flag_SumUsingItem;
		if (saveConfig.Barcode_CR_Item_P2 == -2)
		{
			P1_P2PLUNumber_radioButton.Checked = true;
		}
		else if (saveConfig.Barcode_CR_Item_P2 < 0)
		{
			P1_P2ItemCode_radioButton.Checked = true;
		}
		else
		{
			P1_P2Const_radioButton.Checked = true;
			P1_P2Const_numericUpDown.Value = saveConfig.Barcode_CR_Item_P2;
		}
		P1_P3Total_radioButton.Checked = !saveConfig.Barcode_CR_Item_P3_Weight;
		P1_P3Amount_radioButton.Checked = saveConfig.Barcode_CR_Item_P3_Weight;
		if (saveConfig.Barcode_CR_CheckType == 1)
		{
			P1_Check_NS_radioButton.Checked = true;
		}
		else if (saveConfig.Barcode_CR_CheckType == 2)
		{
			P1_Check_C0_radioButton.Checked = true;
		}
		else
		{
			P1_Check_S_radioButton.Checked = true;
		}
		P1_Part5_groupBox.Enabled = saveConfig.Barcode_CR_CheckType == 1 || saveConfig.Barcode_CR_CheckType == 2 || Program.right != Program.Right.User;
		P1_Part6_groupBox.Enabled = Program.right != Program.Right.User;
		P1_P3_4TotalWeight_radioButton.Checked = !saveConfig.Barcode_CR_Sum_UsePcsAsAmount;
		P1_P3_4TotalPcs_radioButton.Checked = saveConfig.Barcode_CR_Sum_UsePcsAsAmount;
		if (saveConfig.Barcode_CR_QR)
		{
			P1_P7_SumQR_RadioButton.Checked = true;
		}
		else
		{
			P1_P7_SumEAN_RadioButton.Checked = true;
		}
		P1_P7_SingleQR_CheckBox.Checked = (saveConfig.Barcode_CR_QR_Para & 1) != 0;
		P1_P7_NoLastEnter_CheckBox.Checked = (saveConfig.Barcode_CR_QR_Para & 2) != 0;
		P1_P7_QRVersion_NumericUpDown.Value = saveConfig.Barcode_CR_QR_Version;
		if (saveConfig.Barcode_SP_Type == 0)
		{
			barcode_Special_PLUInfo_RadioButton.Checked = true;
		}
		else
		{
			barcode_Special_Constant_RadioButton.Checked = true;
		}
		barcode_Special_PLUInfo_ComboBox.SelectedIndex = saveConfig.Barcode_SP_PLUInfo;
		barcode_Special_Constant_TextBox.Text = saveConfig.Barcode_SP_Constant;
		barcode_Special_Type_ComboBox.SelectedIndex = saveConfig.Barcode_SP_BType;
		barcode_Special_CheckDigit_CheckBox.Checked = saveConfig.Barcode_SP_TryAddCheckDigit;
		barcode_Special_CheckDigit_CheckBox.Enabled = barcode_Special_CheckDigit_CheckBox.Checked || Program.right != Program.Right.User;
		barcode_ManualEdit_CheckDigit_CheckBox.Checked = saveConfig.Barcode_ME_TryAddCheckDigit;
		barcode_ManualEdit_BType_ComboBox.SelectedIndex = saveConfig.Barcode_ME_BType;
		P5_AM_Admin_checkBox.Checked = saveConfig.PW_Admin_Sel;
		P5_AM_Admin_textBox.Text = saveConfig.PW_Admin_String;
		P5_AM_Sale_checkBox.Checked = saveConfig.PW_Sale_Sel;
		P5_AM_Sale_textBox.Text = saveConfig.PW_Sale_String;
		P5_AM_Prog_checkBox.Checked = saveConfig.PW_Prog_Sel;
		P5_AM_Prog_textBox.Text = saveConfig.PW_Prog_String;
		P5_AM_Account_checkBox.Checked = saveConfig.PW_Account_Sel;
		P5_AM_Account_textBox.Text = saveConfig.PW_Account_String;
		P5_AM_Drawer_checkBox.Checked = saveConfig.PW_Drawer_Sel;
		P5_AM_Drawer_textBox.Text = saveConfig.PW_Drawer_String;
		P5_AM_PriceFProg_checkBox.Checked = saveConfig.PW_PriceFProg_Sel;
		P5_AM_PriceFProg_textBox.Text = saveConfig.PW_PriceFProg_String;
		GetAdminInCharge(saveConfig.MG_AdminInCharge);
		if (saveConfig.MG_UnitPriceChangeForbidden)
		{
			P5_UnitPrice_Forbidden_radioButton.Checked = true;
		}
		else
		{
			P5_UnitPrice_Allowed_radioButton.Checked = true;
		}
		if (saveConfig.MG_GrandTotalChangeForbidden)
		{
			P5_TotalPrice_Forbidden_radioButton.Checked = true;
		}
		else
		{
			P5_TotalPrice_Allowed_radioButton.Checked = true;
		}
		if (saveConfig.MG_AccuClear == 1)
		{
			P5_VBuffer_1_radioButton.Checked = true;
		}
		else if (saveConfig.MG_AccuClear == 2)
		{
			P5_VBuffer_2_radioButton.Checked = true;
		}
		else if (saveConfig.MG_AccuClear == 3)
		{
			P5_VBuffer_3_radioButton.Checked = true;
		}
		else if (saveConfig.MG_AccuClear == 4)
		{
			P5_VBuffer_4_radioButton.Checked = true;
		}
		else if (saveConfig.MG_AccuClear == 0)
		{
			P5_VBuffer_0_radioButton.Checked = true;
		}
		if (saveConfig.MG_Unconfirm == 1)
		{
			P5_Unconfirmed_1_radioButton.Checked = true;
		}
		else if (saveConfig.MG_Unconfirm == 2)
		{
			P5_Unconfirmed_2_radioButton.Checked = true;
		}
		else if (saveConfig.MG_Unconfirm == 0)
		{
			P5_Unconfirmed_0_radioButton.Checked = true;
		}
		if (saveConfig.MG_ZeroBack == 1)
		{
			P5_ZeroBack_1_radioButton.Checked = true;
		}
		else if (saveConfig.MG_ZeroBack == 2)
		{
			P5_ZeroBack_2_radioButton.Checked = true;
		}
		else if (saveConfig.MG_ZeroBack == 3)
		{
			P5_ZeroBack_3_radioButton.Checked = true;
		}
		else if (saveConfig.MG_ZeroBack == 3)
		{
			P5_ZeroBack_3_radioButton.Checked = true;
		}
		else if (saveConfig.MG_ZeroBack == 0)
		{
			P5_ZeroBack_0_radioButton.Checked = true;
		}
		if (saveConfig.MG_xxxRight == "Full")
		{
			MG_FullRight_RadioButton.Checked = true;
		}
		else if (saveConfig.MG_xxxRight == "Limited")
		{
			MG_LimitedRight_RadioButton.Checked = true;
		}
		else if (saveConfig.MG_xxxRight == "No")
		{
			MG_NoRight_RadioButton.Checked = true;
		}
		else
		{
			MG_CustomRight_RadioButton.Checked = true;
		}
		GetSetting_RadioButton(saveConfig.MG_PriceFProg, new RadioButton[5] { P5_PriceFProg_0_radioButton, P5_PriceFProg_1_radioButton, P5_PriceFProg_2_radioButton, P5_PriceFProg_3_radioButton, P5_PriceFProg_4_radioButton });
		GetSetting_RadioButton(saveConfig.MG_ZeroReturn, new RadioButton[3] { P5_ZeroReturn_0_radioButton, P5_ZeroReturn_3_radioButton, P5_ZeroReturn_4_radioButton }, new int[3] { 0, 3, 4 });
		GetSetting_RadioButton(saveConfig.MG_Hangup, new RadioButton[4] { P5_Hangup_0_radioButton, P5_Hangup_1_radioButton, P5_Hangup_2_radioButton, P5_Hangup_3_radioButton });
		if ((saveConfig.MG_BuyBack & 1) != 0)
		{
			P5_BuyBack_A1_checkBox.Checked = true;
		}
		if ((saveConfig.MG_BuyBack & 2) != 0)
		{
			P5_BuyBack_A2_checkBox.Checked = true;
		}
		if ((saveConfig.MG_BuyBack & 4) != 0)
		{
			P5_BuyBack_A4_checkBox.Checked = true;
		}
		if ((saveConfig.MG_BuyBack & 8) != 0)
		{
			P5_BuyBack_A8_checkBox.Checked = true;
		}
		if ((saveConfig.MG_BuyBack & 0x10) != 0)
		{
			P5_BuyBack_A16_checkBox.Checked = true;
		}
		if ((saveConfig.MG_BuyBack & 0x20) != 0)
		{
			P5_BuyBack_A32_checkBox.Checked = true;
		}
		if ((saveConfig.MG_BuyBack & 0x40) != 0)
		{
			P5_BuyBack_A64_checkBox.Checked = true;
		}
		if ((saveConfig.MG_BuyBack & 0x80) != 0)
		{
			P5_BuyBack_A128_checkBox.Checked = true;
		}
		if ((saveConfig.MG_BuyBack & 0x100) != 0)
		{
			P5_BuyBack_A256_checkBox.Checked = true;
		}
		if ((saveConfig.MG_BuyBack & 0x200) != 0)
		{
			P5_BuyBack_A512_checkBox.Checked = true;
		}
		if ((saveConfig.MG_Payments & 1) == 0)
		{
			P5_Payments_A1_checkBox.Checked = true;
		}
		if ((saveConfig.MG_Payments & 2) == 0)
		{
			P5_Payments_A2_checkBox.Checked = true;
		}
		if ((saveConfig.MG_Payments & 4) == 0)
		{
			P5_Payments_A4_checkBox.Checked = true;
		}
		if ((saveConfig.MG_Payments & 8) == 0)
		{
			P5_Payments_A8_checkBox.Checked = true;
		}
		if ((saveConfig.MG_Payments & 0x10) == 0)
		{
			P5_Payments_A16_checkBox.Checked = true;
		}
		if ((saveConfig.MG_Payments & 0x20) == 0)
		{
			P5_Payments_A32_checkBox.Checked = true;
		}
		GetSetting_RadioButton(saveConfig.MISC_UPPoint, new RadioButton[6] { P4_UPriceRadixPoint0_radioButton, P4_UPriceRadixPoint1_radioButton, P4_UPriceRadixPoint2_radioButton, P4_UPriceRadixPoint3_radioButton, P4_UPriceRadixPoint4_radioButton, P4_UPriceRadixPoint5_radioButton });
		GetSetting_RadioButton(saveConfig.MISC_TPPoint, new RadioButton[6] { P4_TotalRadixPoint0_radioButton, P4_TotalRadixPoint1_radioButton, P4_TotalRadixPoint2_radioButton, P4_TotalRadixPoint3_radioButton, P4_TotalRadixPoint4_radioButton, P4_TotalRadixPoint5_radioButton });
		GetSetting_RadioButton(saveConfig.MISC_STRounding, new RadioButton[5] { P4_ItemRounding0_S0_radioButton, P4_ItemRounding1_S9_radioButton, P4_ItemRounding2_S1_radioButton, P4_ItemRounding3_S10_radioButton, P4_ItemRounding4_S2_radioButton }, new int[5] { 0, 9, 1, 10, 2 });
		GetSetting_RadioButton(saveConfig.MISC_TTRounding, new RadioButton[5] { P4_TotalRounding0_S0_radioButton, P4_TotalRounding1_S9_radioButton, P4_TotalRounding2_S1_radioButton, P4_TotalRounding3_S10_radioButton, P4_TotalRounding4_S2_radioButton }, new int[5] { 0, 9, 1, 10, 2 });
		P2_Prefix_textBox.Text = saveConfig.MISC_Prefix;
		P2_Suffix_textBox.Text = saveConfig.MISC_Suffix;
		P2_PrintUnit_Amount_checkbox.Checked = saveConfig.MISC_PrintUnit_Amount;
		P2_PrintUnit_UPrice_checkbox.Checked = saveConfig.MISC_PrintUnit_UPrice;
		P2_PrintUnit_Money_checkbox.Checked = saveConfig.MISC_PrintUnit_Money;
		GetSetting_RadioButton(saveConfig.MISC_PLUInfo_Font, new RadioButton[4] { P3_PLUinfo_Font0_radioButton, P3_PLUinfo_Font1_radioButton, P3_PLUinfo_Font2_radioButton, P3_PLUinfo_Font3_radioButton });
		GetSetting_RadioButton(saveConfig.MISC_IdleInfo_Font, new RadioButton[4] { P3_noPLUinfo_Font0_radioButton, P3_noPLUinfo_Font1_radioButton, P3_noPLUinfo_Font2_radioButton, P3_noPLUinfo_Font3_radioButton });
		P3_PLUinfo_S1_comboBox.SelectedValue = saveConfig.MISC_PLUInfo_S1;
		P3_PLUinfo_S2_comboBox.SelectedValue = saveConfig.MISC_PLUInfo_S2;
		P3_DoubleSource_checkBox.Checked = saveConfig.MISC_PLUInfo_S1 != saveConfig.MISC_PLUInfo_S2;
		GetSetting_RadioButton(saveConfig.MISC_IdleInfo_S, new RadioButton[4] { P3_Idleinfo_Source0_radioButton, P3_Idleinfo_Source1_radioButton, P3_Idleinfo_Source2_radioButton, P3_Idleinfo_Source3_radioButton });
		saveConfig.MISC_IdleInfo_SS = P3_Idleinfo_Source3_textBox.Text;
		GetSetting_RadioButton(saveConfig.MISC_AccuInfo_S, new RadioButton[3] { P3_Accedinfo_Source0_radioButton, P3_Accedinfo_Source1_radioButton, P3_Accedinfo_Source2_radioButton });
		ctSC = saveConfig;
	}

	private int Barcode_CR_Type_GetInt()
	{
		if (P1_Type2551_radioButton.Checked)
		{
			return 25501;
		}
		if (P1_Type2641_radioButton.Checked)
		{
			return 26401;
		}
		if (P1_Type2461_radioButton.Checked)
		{
			return 24601;
		}
		if (P1_Type1651_radioButton.Checked)
		{
			return 16501;
		}
		if (P1_Type1561_radioButton.Checked)
		{
			return 15601;
		}
		if (P1_Type25551_radioButton.Checked)
		{
			return 25551;
		}
		if (P1_Type26451_radioButton.Checked)
		{
			return 26451;
		}
		if (P1_Type24651_radioButton.Checked)
		{
			return 24651;
		}
		if (P1_Type16551_radioButton.Checked)
		{
			return 16551;
		}
		if (P1_Type15651_radioButton.Checked)
		{
			return 15651;
		}
		return 25501;
	}

	private void Barcode_CR_Type_SetInt(int CR_Type)
	{
		switch (CR_Type)
		{
		case 25501:
			P1_Type2551_radioButton.Checked = true;
			break;
		case 26401:
			P1_Type2641_radioButton.Checked = true;
			break;
		case 24601:
			P1_Type2461_radioButton.Checked = true;
			break;
		case 16501:
			P1_Type1651_radioButton.Checked = true;
			break;
		case 15601:
			P1_Type1561_radioButton.Checked = true;
			break;
		case 25551:
			P1_Type25551_radioButton.Checked = true;
			break;
		case 26451:
			P1_Type26451_radioButton.Checked = true;
			break;
		case 24651:
			P1_Type24651_radioButton.Checked = true;
			break;
		case 16551:
			P1_Type16551_radioButton.Checked = true;
			break;
		case 15651:
			P1_Type15651_radioButton.Checked = true;
			break;
		default:
			P1_Type2551_radioButton.Checked = true;
			break;
		}
	}

	private string GetDisplay(ECSDataSet.LabelItemRow row)
	{
		int flag = row.Flag1;
		int flag2 = row.Flag2;
		int flag3 = row.Flag3;
		UIDataSet.LabelItem_Flag1Row labelItem_Flag1Row = uIDataSet.LabelItem_Flag1.FindByFlag1(flag);
		string text = ((labelItem_Flag1Row == null) ? string.Empty : labelItem_Flag1Row.Display);
		UIDataSet.LabelItem_Flag2Row labelItem_Flag2Row = uIDataSet.LabelItem_Flag2.FindByFlag1Flag2(flag, flag2);
		string text2 = ((labelItem_Flag2Row == null) ? string.Empty : labelItem_Flag2Row.Display);
		UIDataSet.LabelItem_Flag3Row labelItem_Flag3Row = uIDataSet.LabelItem_Flag3.FindByFlag1Flag3(flag, flag3);
		string text3 = ((labelItem_Flag3Row == null) ? string.Empty : labelItem_Flag3Row.Display);
		UIDataSet.LabelItem_Flag4Row labelItem_Flag4Row = uIDataSet.LabelItem_Flag4.FindByFlag1Flag2Flag4(flag, flag2, flag3);
		string text4 = ((labelItem_Flag4Row == null) ? string.Empty : labelItem_Flag4Row.Display);
		switch (flag)
		{
		case 2:
		case 4:
		case 5:
		case 6:
			return text + " - " + text2;
		case 0:
		case 1:
			return text + " - " + text2 + " - " + text3;
		case 3:
		{
			if (flag2 < 0 || flag2 > 31)
			{
				return string.Empty;
			}
			ECSDataSet.LabelRow labelRow = row.LabelRow;
			string result = "";
			try
			{
				result = (string)labelRow["Text" + (flag2 + 1)];
			}
			catch (Exception)
			{
			}
			return result;
		}
		case 7:
			return text + " - " + text2 + " - " + text4;
		default:
			return string.Empty;
		}
	}

	private void FindCustom()
	{
		string fileName = Application.StartupPath + "\\Custom.xml";
		uIDataSet.Custom.ReadXml(fileName);
		DataRow[] array = uIDataSet.Custom.Select("[Table] = 'Custom1'");
		if (array.Length > 0)
		{
			custom1Row = array[0] as UIDataSet.CustomRow;
		}
		array = uIDataSet.Custom.Select("[Table] = 'Custom2'");
		if (array.Length > 0)
		{
			custom2Row = array[0] as UIDataSet.CustomRow;
		}
		array = uIDataSet.Custom.Select("[Table] = 'Custom3'");
		if (array.Length > 0)
		{
			custom3Row = array[0] as UIDataSet.CustomRow;
		}
		array = uIDataSet.Custom.Select("[Table] = 'Custom4'");
		if (array.Length > 0)
		{
			custom4Row = array[0] as UIDataSet.CustomRow;
		}
	}

	private void LangSocket_Ramuza()
	{
		CheckBox p5_AM_Account_checkBox = P5_AM_Account_checkBox;
		TextBox p5_AM_Account_textBox = P5_AM_Account_textBox;
		CheckBox p5_AM_Drawer_checkBox = P5_AM_Drawer_checkBox;
		TextBox p5_AM_Drawer_textBox = P5_AM_Drawer_textBox;
		CheckBox p5_AM_PriceFProg_checkBox = P5_AM_PriceFProg_checkBox;
		TextBox p5_AM_PriceFProg_textBox = P5_AM_PriceFProg_textBox;
		CheckBox hangupWrite_CheckBox = HangupWrite_CheckBox;
		CheckBox fProgPrice_CheckBox = FProgPrice_CheckBox;
		CheckBox drawer_CheckBox = Drawer_CheckBox;
		CheckBox hangupRead_CheckBox = HangupRead_CheckBox;
		CheckBox buyBack_CheckBox = BuyBack_CheckBox;
		GroupBox p5_TotalPrice_groupBox = P5_TotalPrice_groupBox;
		GroupBox p5_PriceFProg_groupBox = P5_PriceFProg_groupBox;
		GroupBox p5_Payments_groupBox = P5_Payments_groupBox;
		GroupBox p5_Hangup_groupBox = P5_Hangup_groupBox;
		GroupBox p4_UPriceRadixPoint_groupBox = P4_UPriceRadixPoint_groupBox;
		GroupBox p4_TotalRadixPoint_groupBox = P4_TotalRadixPoint_groupBox;
		Button p4_UpdateSoftware_button = P4_UpdateSoftware_button;
		bool flag = (P2_UnitSetting_groupBox.Visible = false);
		bool flag3 = (p4_UpdateSoftware_button.Visible = flag);
		bool flag5 = (p4_TotalRadixPoint_groupBox.Visible = flag3);
		bool flag7 = (p4_UPriceRadixPoint_groupBox.Visible = flag5);
		bool flag9 = (p5_Hangup_groupBox.Visible = flag7);
		bool flag11 = (p5_Payments_groupBox.Visible = flag9);
		bool flag13 = (p5_PriceFProg_groupBox.Visible = flag11);
		bool flag15 = (p5_TotalPrice_groupBox.Visible = flag13);
		bool flag17 = (buyBack_CheckBox.Visible = flag15);
		bool flag19 = (hangupRead_CheckBox.Visible = flag17);
		bool flag21 = (drawer_CheckBox.Visible = flag19);
		bool flag23 = (fProgPrice_CheckBox.Visible = flag21);
		bool flag25 = (hangupWrite_CheckBox.Visible = flag23);
		bool flag27 = (p5_AM_PriceFProg_textBox.Visible = flag25);
		bool flag29 = (p5_AM_PriceFProg_checkBox.Visible = flag27);
		bool flag31 = (p5_AM_Drawer_textBox.Visible = flag29);
		bool flag33 = (p5_AM_Drawer_checkBox.Visible = flag31);
		bool visible = (p5_AM_Account_textBox.Visible = flag33);
		p5_AM_Account_checkBox.Visible = visible;
		ctSC.Mode_Prepack = (ctSC.Mode_OneItemOnly = true);
		RadioButton mode_LabelPrint_RadioButton = Mode_LabelPrint_RadioButton;
		bool flag36 = (Mode_OneItemOnly_checkBox.Checked = true);
		mode_LabelPrint_RadioButton.Checked = flag36;
		CheckBox mode_OneItemOnly_checkBox = Mode_OneItemOnly_checkBox;
		RadioButton mode_CashRegister_RadioButton = Mode_CashRegister_RadioButton;
		bool flag38 = (Mode_ScanInternalBarcode_checkBox.Visible = false);
		bool visible2 = (mode_CashRegister_RadioButton.Visible = flag38);
		mode_OneItemOnly_checkBox.Visible = visible2;
		text6DataGridViewTextBoxColumn.HeaderText = "Lot";
		costDataGridViewTextBoxColumn.HeaderText = "Desconto";
		costDataGridViewTextBoxColumn.DataPropertyName = "DA_Num4";
	}

	private void WizardForm_Load(object sender, EventArgs e)
	{
		versionTip_Label.Text = Program.GetLang("pw_SomefunctionsofthisConfigWizardneeddeviceversionafterV2_49A");
		reset_Button.Text = Program.GetLang("pw_ResetConfigWizard");
		Print_Button.Text = Program.GetLang("pw_Print");
		P1_Part6_groupBox.Text = Program.GetLang("pw_DecimalPointinBarcode");
		P1_Part6_MoneyDecimal_Label.Text = Program.GetLang("pw_Money");
		P1_Part6_WeightDecimal_Label.Text = Program.GetLang("pw_Weight");
		P1_Part6_PcsDecimal_Label.Text = Program.GetLang("pw_Count");
		P2_PrintUnit_Amount_checkbox.Text = Program.GetLang("pw_Printunitwithweight_pcs");
		P2_PrintUnit_UPrice_checkbox.Text = Program.GetLang("pw_Printunitwithunitprice");
		P2_PrintUnit_Money_checkbox.Text = Program.GetLang("pw_Printunitwithmoney");
		P1_P7_SumEAN_RadioButton.Text = Program.GetLang("pw_SummaryInEAN");
		P1_P7_SumQR_RadioButton.Text = Program.GetLang("pw_DetailsInQR");
		P1_P7_SingleQR_CheckBox.Text = Program.GetLang("pw_ItemBarcodeAlsoPrintInQR");
		P1_P7_NoLastEnter_CheckBox.Text = Program.GetLang("pw_LastEnterDoNotIncluded");
		P1_Part7_groupBox.Text = Program.GetLang("pw_SumBarcodeType");
		export_ethernet_Label.Text = Program.GetLang("pw_Ethernet");
		export_usb_Label.Text = Program.GetLang("pw_TMSFile");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_Add");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		cloneToolStripButton.Text = Program.GetLang("pw_Clone");
		Display.HeaderText = Program.GetLang("pw_Name");
		Drawer_CheckBox.Text = Program.GetLang("pw_Drawer");
		FProgPrice_CheckBox.Text = Program.GetLang("pw_FProgofPrice");
		HangupRead_CheckBox.Text = Program.GetLang("pw_LoadbackBill");
		HangupWrite_CheckBox.Text = Program.GetLang("pw_HangupBill");
		ItemQuit_CheckBox.Text = Program.GetLang("pw_PLUQuit");
		BuyBack_CheckBox.Text = Program.GetLang("pw_BuyBack_OT");
		Amend_CheckBox.Text = Program.GetLang("pw_Amend");
		Reprint_CheckBox.Text = Program.GetLang("pw_Re-print");
		Preprint_CheckBox.Text = Program.GetLang("pw_Pre-print");
		TSaleCT_CheckBox.Text = Program.GetLang("pw_TSale_CT");
		TSaleWT_CheckBox.Text = Program.GetLang("pw_TSale_WT");
		IllegalReboot_CheckBox.Text = Program.GetLang("pw_IllegalReboot");
		Next_button.Text = Program.GetLang("pw_Next");
		Previous_button.Text = Program.GetLang("pw_Previous");
		pt_Picture_Label.Text = Program.GetLang("pw_Bitmap");
		PT_Rotate_checkBox.Text = Program.GetLang("pw_Rotate180_");
		barcode_CashRegister_RadioButton.Text = Program.GetLang("pw_BarcodeforCashRegister");
		barcode_ManualEdit_CheckDigit_CheckBox.Text = Program.GetLang("pw_TrytoAddCheckDigit");
		barcode_ManualEdit_RadioButton.Text = Program.GetLang("pw_ManualEditBarcode");
		barcode_ManualEdit_Type_Label.Text = Program.GetLang("pw_Format") + ":";
		barcode_Special_CheckDigit_CheckBox.Text = Program.GetLang("pw_TrytoAddCheckDigit");
		barcode_Special_Constant_RadioButton.Text = Program.GetLang("pw_ConstantText");
		barcode_Special_PLUInfo_RadioButton.Text = Program.GetLang("pw_PLUInfo");
		barcode_Special_RadioButton.Text = Program.GetLang("pw_SomeSpecialBarcode");
		barcode_Special_Type_Label.Text = Program.GetLang("pw_BarcodeType");
		Device_A_RadioButton.Text = Program.GetLang("pw_BarCodePrintingScale");
		Device_A08_RadioButton.Text = Program.GetLang("pw_2008_s");
		Device_A12_RadioButton.Text = Program.GetLang("pw_2012_s");
		Device_A15_RadioButton.Text = Program.GetLang("pw_2015_sA");
		Device_A17_RadioButton.Text = Program.GetLang("pw_2017_sA");
		Device_C_RadioButton.Text = Program.GetLang("pw_CashRegisterScale");
		Device_C11_RadioButton.Text = Program.GetLang("pw_2011_s");
		Device_C15_RadioButton.Text = Program.GetLang("pw_2015_sC");
		Device_Axx_4w_RadioButton.Text = Program.GetLang("pw_4Windows");
		Device_Axx_5w_RadioButton.Text = Program.GetLang("pw_5Windows");
		Device_Axx_np_RadioButton.Text = Program.GetLang("pw_NoPole");
		Device_B_RadioButton.Text = Program.GetLang("pw_PricePrintingScale");
		Device_Cxx_4w_RadioButton.Text = Program.GetLang("pw_4Windows");
		Device_Cxx_5w_RadioButton.Text = Program.GetLang("pw_5Windows");
		Device_D_RadioButton.Text = Program.GetLang("pw_CashRegister");
		Device_E_RadioButton.Text = Program.GetLang("pw_A1Indicator");
		Device_F_RadioButton.Text = Program.GetLang("pw_A2Indicator");
		Group_Label.Text = Program.GetLang("pw_Group") + ":";
		mg_AdminIC_groupBox.Text = Program.GetLang("pw_AdmininCharge_Theseoperationneed_Admin_Password_");
		MG_CustomRight_RadioButton.Text = Program.GetLang("pw_Custom");
		MG_FullRight_RadioButton.Text = Program.GetLang("pw_FullRight");
		MG_LimitedRight_RadioButton.Text = Program.GetLang("pw_LimitedRight");
		MG_NoRight_RadioButton.Text = Program.GetLang("pw_NoRight");
		Mode_CashRegister_RadioButton.Text = Program.GetLang("pw_Cashregistermode_sl_printreceipt_itemaccumulates");
		Mode_GapPaper0_RadioButton.Text = Program.GetLang("pw_Other");
		Mode_GapPaper30x40_RadioButton.Text = Program.GetLang("pw_30mm*40mm");
		Mode_GapPaper40x30_RadioButton.Text = Program.GetLang("pw_40mm*30mm");
		Mode_GapPaper60x30_RadioButton.Text = Program.GetLang("pw_60mm*30mm");
		Mode_GapPaper60x40_RadioButton.Text = Program.GetLang("pw_60mm*40mm");
		Mode_GapPapper_RadioButton.Text = Program.GetLang("pw_GapPaper_W_H");
		Mode_Gray_label.Text = Program.GetLang("pw_GrayLevel");
		Mode_LabelPrint_RadioButton.Text = Program.GetLang("pw_LabelPrintmode_sl_printbarcode_whichscannedbycashregister");
		Mode_OneItemOnly_checkBox.Text = Program.GetLang("pw_Oneitembillonly_Noaccumulateallowed_");
		Mode_ScanInternalBarcode_checkBox.Text = Program.GetLang("pw_ScanBarcodePrintedbyScales");
		Mode_PlainPaper0_RadioButton.Text = Program.GetLang("pw_Other");
		Mode_PlainPaper40_RadioButton.Text = Program.GetLang("pw_40mmwidth");
		Mode_PlainPaper57_RadioButton.Text = Program.GetLang("pw_57mmwidth");
		Mode_PlainPaper60_RadioButton.Text = Program.GetLang("pw_60mmwidth");
		Mode_PlainPapper_RadioButton.Text = Program.GetLang("pw_PlainPapper");
		Mode_PrintDirect_checkBox.Text = Program.GetLang("pw_Printoncepress_Confirm_");
		OpMain_FirstConfig_radioButton.Text = Program.GetLang("pw_Firstconfigorchangeconfig");
		OpMain_WorkData_radioButton.Text = Program.GetLang("pw_Editworkingdataonly");
		OpMain_TMSout_radioButton.Text = Program.GetLang("pw_Exportconfiganddatadirectly");
		OpMain_LabelBarcode_CheckBox.Text = Program.GetLang("pw_PrintFormatAndBarcode");
		OpMain_Management_CheckBox.Text = Program.GetLang("pw_Management");
		OpMain_SaleOperation_CheckBox.Text = Program.GetLang("pw_SaleOperation");
		OpMain_UnitDisplay_CheckBox.Text = Program.GetLang("pw_UnitAndDisplay");
		OpMain_PLU_CheckBox.Text = Program.GetLang("pw_PLU");
		OpMain_SCP_CheckBox.Text = Program.GetLang("pw_ShortcutKey");
		P1_Check_C0_radioButton.Text = Program.GetLang("pw_Character_0_");
		P1_Check_NS_radioButton.Text = Program.GetLang("pw_Non_standard");
		P1_Check_S_radioButton.Text = Program.GetLang("pw_Standard");
		P1_P1_2_label.Text = Program.GetLang("pw_SumFlag");
		P1_P1_label.Text = Program.GetLang("pw_Flag");
		P1_P2Const_radioButton.Text = Program.GetLang("pw_Constant");
		P1_P2ItemCode_radioButton.Text = Program.GetLang("pw_ItemCode");
		P1_P2PLUNumber_radioButton.Text = Program.GetLang("pw_PLUNumber");
		P1_P3_4TotalPcs_radioButton.Text = Program.GetLang("pw_TotalPcs");
		P1_P3_4TotalWeight_radioButton.Text = Program.GetLang("pw_TotalWeight");
		P1_P3Amount_radioButton.Text = Program.GetLang("pw_Weight_Pcs");
		P1_P3Total_radioButton.Text = Program.GetLang("pw_GrandTotal");
		P1_P4Amount_radioButton.Text = Program.GetLang("pw_Weight_Pcs");
		P1_P4Total_radioButton.Text = Program.GetLang("pw_GrandTotal");
		P1_Part1_2Sum_groupBox.Text = Program.GetLang("pw_Sum_sl_Part1and2");
		P1_Part1_2Sum_UseItem_CheckBox.Text = Program.GetLang("pw_Use1stItemInformation");
		P1_Part1_groupBox.Text = Program.GetLang("pw_Item_sl_Part1");
		P1_Part2_groupBox.Text = Program.GetLang("pw_Item_sl_Part2");
		P1_Part3_4Sum_groupBox.Text = Program.GetLang("pw_Sum_sl_Part3or4");
		P1_Part3_groupBox.Text = Program.GetLang("pw_Item_sl_Part3");
		P1_Part4_groupBox.Text = Program.GetLang("pw_Item_sl_Part4");
		P1_Part5_groupBox.Text = Program.GetLang("pw_CheckSum");
		P1_Type_groupBox.Text = Program.GetLang("pw_Type");
		P2_Money_label.Text = Program.GetLang("pw_MoneyUnit");
		P2_Prefix_label.Text = Program.GetLang("pw_Prefix");
		P2_PrintUnit_addPcs_label.Text = Program.GetLang("pw_pcs");
		P2_PrintUnit_addWeight_label.Text = Program.GetLang("pw_kg");
		P2_PrintUnit_tPcs_label.Text = Program.GetLang("pw_Count");
		P2_PrintUnit_tWeight_label.Text = Program.GetLang("pw_Weight");
		P2_Suffix_label.Text = Program.GetLang("pw_Suffix");
		P2_UnitSetting_groupBox.Text = Program.GetLang("pw_UnitSetting");
		P3_Accedinfo_Source0_radioButton.Text = Program.GetLang("pw_AccumulatedInfo_0");
		P3_Accedinfo_Source2_radioButton.Text = Program.GetLang("pw_AccumulatedInfo_2");
		P3_Accedinfo_Source1_radioButton.Text = Program.GetLang("pw_SameasIdle");
		P3_DoubleSource_checkBox.Text = Program.GetLang("pw_DoubleSource");
		P3_Idleinfo_Source0_radioButton.Text = Program.GetLang("pw_Time");
		P3_Idleinfo_Source1_radioButton.Text = Program.GetLang("pw_StoreName");
		P3_Idleinfo_Source2_radioButton.Text = Program.GetLang("pw_DeviceName");
		P3_Idleinfo_Source3_radioButton.Text = Program.GetLang("pw_CustomText");
		P3_label1.Text = Program.GetLang("pw_Font");
		P3_label2.Text = Program.GetLang("pw_Source");
		P3_label3.Text = Program.GetLang("pw_Font");
		P3_label4.Text = Program.GetLang("pw_Idle");
		P3_label5.Text = Program.GetLang("pw_Accumulated");
		P3_noPLUinfo_Font0_radioButton.Text = Program.GetLang("pw_Self_adapting");
		P3_noPLUinfo_Font1_radioButton.Text = Program.GetLang("pw_Font1");
		P3_noPLUinfo_Font2_radioButton.Text = Program.GetLang("pw_Font0");
		P3_noPLUinfo_Font3_radioButton.Text = Program.GetLang("pw_2LineMode");
		P3_noPLUinfo_groupBox.Text = Program.GetLang("pw_NoPLUInfoDisplay");
		P3_PLUinfo_Font0_radioButton.Text = Program.GetLang("pw_Self_adapting");
		P3_PLUinfo_Font1_radioButton.Text = Program.GetLang("pw_Font1");
		P3_PLUinfo_Font2_radioButton.Text = Program.GetLang("pw_Font0");
		P3_PLUinfo_Font3_radioButton.Text = Program.GetLang("pw_2LineMode");
		P3_PLUinfo_groupBox.Text = Program.GetLang("pw_PLUInfoDisplay");
		P4_ItemRounding_groupBox.Text = Program.GetLang("pw_ItemTotalRounding");
		P4_TotalRadixPoint_groupBox.Text = Program.GetLang("pw_TotalRadixPoint");
		P4_TotalRounding_groupBox.Text = Program.GetLang("pw_GrandTotalRounding");
		P4_UpdateSoftware_button.Text = Program.GetLang("pw_UpdateSoftware");
		P4_UPriceRadixPoint_groupBox.Text = Program.GetLang("pw_UnitPriceRadixPoint");
		P5_AM_Account_checkBox.Text = Program.GetLang("pw_Account");
		P5_AM_Admin_checkBox.Text = Program.GetLang("pw_Admin");
		P5_AM_Drawer_checkBox.Text = Program.GetLang("pw_Drawer");
		P5_AM_PriceFProg_checkBox.Text = Program.GetLang("pw_PriceF_Prog");
		P5_AM_Prog_checkBox.Text = Program.GetLang("pw_Prog");
		P5_AM_Sale_checkBox.Text = Program.GetLang("pw_Sale");
		P5_BuyBack_1_Label.Text = Program.GetLang("pw_Entrance_sl_Press_PLU_+_Amend__Switch_sl_Press_x_");
		P5_BuyBack_A1_checkBox.Text = Program.GetLang("pw_Existlogbuyback");
		P5_BuyBack_A128_checkBox.Text = Program.GetLang("pw_Stocktaking");
		P5_BuyBack_A16_checkBox.Text = Program.GetLang("pw_Priceswith");
		P5_BuyBack_A2_checkBox.Text = Program.GetLang("pw_Newinputbuyback");
		P5_BuyBack_A256_checkBox.Text = Program.GetLang("pw_Order");
		P5_BuyBack_A512_checkBox.Text = Program.GetLang("pw_Spoilage");
		P5_BuyBack_A32_checkBox.Text = Program.GetLang("pw_Inbound");
		P5_BuyBack_A4_checkBox.Text = Program.GetLang("pw_Mixallowedwithsale");
		P5_BuyBack_A64_checkBox.Text = Program.GetLang("pw_Outbound");
		P5_BuyBack_A8_checkBox.Text = Program.GetLang("pw_Amountswith");
		P5_BuyBack_groupBox.Text = Program.GetLang("pw_OtherTransactions");
		P5_ZeroBack_0_radioButton.Text = Program.GetLang("pw_AlwaysZeroReturn");
		P5_ZeroBack_1_radioButton.Text = Program.GetLang("pw_ZeroReturnifWeightChanged");
		P5_ZeroBack_2_radioButton.Text = Program.GetLang("pw_NoZeroReturn");
		P5_ZeroBack_3_radioButton.Text = Program.GetLang("pw_ZeroReturnfornewbyweightPLU");
		P5_ZeroBack_4_radioButton.Text = Program.GetLang("pw_KeepatZerofornewbyweightPLU");
		P5_ZeroBack_groupBox.Text = Program.GetLang("pw_ZeroReturnForWeightSale");
		P5_Hangup_0_radioButton.Text = Program.GetLang("pw_Forbidden");
		P5_Hangup_1_radioButton.Text = Program.GetLang("pw_Onlyhangupbillcanbeloadonce");
		P5_Hangup_2_radioButton.Text = Program.GetLang("pw_Onlyhangupbillcanbeload_notimeslimit");
		P5_Hangup_3_radioButton.Text = Program.GetLang("pw_Allbillcanbeload");
		P5_Hangup_groupBox.Text = Program.GetLang("pw_HangupandLoadback_Press_Shift_and_Amend__");
		P5_Payments_A1_checkBox.Text = Program.GetLang("pw_Cash");
		P5_Payments_A2_checkBox.Text = Program.GetLang("pw_CardPay_9999995_");
		P5_Payments_A32_checkBox.Text = Program.GetLang("pw_StorePayments_9999991_");
		P5_Payments_A4_checkBox.Text = string.Format(Program.GetLang("pw_OtherPay1_9999994_"), Program.GetLang_Plus("pw_Payment1"));
		P5_Payments_A8_checkBox.Text = string.Format(Program.GetLang("pw_OtherPay2_9999993_"), Program.GetLang_Plus("pw_Payment2"));
		P5_Payments_A16_checkBox.Text = string.Format(Program.GetLang("pw_OtherPay3_9999992_"), Program.GetLang_Plus("pw_Payment3"));
		P5_Payments_groupBox.Text = Program.GetLang("pw_Payments");
		P5_PriceFProg_0_radioButton.Text = Program.GetLang("pw_Forbidden");
		P5_PriceFProg_1_radioButton.Text = Program.GetLang("pw_Longpress__Price_");
		P5_PriceFProg_2_radioButton.Text = Program.GetLang("pw_Press__Price_");
		P5_PriceFProg_3_radioButton.Text = Program.GetLang("pw_Press__Price__longforName");
		P5_PriceFProg_4_radioButton.Text = Program.GetLang("pw_Automaticallysaveaftertransaction");
		P5_PriceFProg_groupBox.Text = Program.GetLang("pw_QuickChangeofDefaultUnitPrice_PriceF_Prog");
		P5_TotalPrice_Allowed_radioButton.Text = Program.GetLang("pw_Allowed");
		P5_TotalPrice_Forbidden_radioButton.Text = Program.GetLang("pw_Forbidden");
		P5_TotalPrice_groupBox.Text = Program.GetLang("pw_GrandTotalChange");
		P5_Unconfirmed_0_radioButton.Text = Program.GetLang("pw_Disable");
		P5_Unconfirmed_1_radioButton.Text = Program.GetLang("pw_RecordPricedOperation");
		P5_Unconfirmed_2_radioButton.Text = Program.GetLang("pw_RecordPriced_WeightedOperation");
		P5_Unconfirmed_groupBox.Text = Program.GetLang("pw_RecordofUnconfirmedData");
		P5_UnitPrice_Allowed_radioButton.Text = Program.GetLang("pw_Allowed");
		P5_UnitPrice_Forbidden_radioButton.Text = Program.GetLang("pw_Forbidden");
		P5_UnitPrice_groupBox.Text = Program.GetLang("pw_UnitPriceChange");
		P5_VBuffer_0_radioButton.Text = Program.GetLang("pw_ManualOperation_NotRecord_");
		P5_VBuffer_1_radioButton.Text = Program.GetLang("pw_ClearAll_Record_");
		P5_VBuffer_2_radioButton.Text = Program.GetLang("pw_ClearAll_NotRecord_");
		P5_VBuffer_3_radioButton.Text = Program.GetLang("pw_ManualOperation_Record_");
		P5_VBuffer_4_radioButton.Text = Program.GetLang("pw_Forbidden");
		P5_VBuffer_groupBox.Text = Program.GetLang("pw_Accumulatedbufferclear_Press_Amend__");
		P5_ZeroReturn_0_radioButton.Text = Program.GetLang("pw_Forbidden");
		P5_ZeroReturn_3_radioButton.Text = Program.GetLang("pw_Autoprint");
		P5_ZeroReturn_4_radioButton.Text = Program.GetLang("pw_Autoprint_can_tcancel");
		P5_ZeroReturn_groupBox.Text = Program.GetLang("pw_Autoprintingafterzero_return");
		mg_Password_groupBox.Text = Program.GetLang("pw_Password");
		pluDataElement_ToolStripButton.Text = Program.GetLang("pw_GridElement");
		PT_Back_Button.Text = Program.GetLang("pw_Save");
		pt_Picture_ClearButton.Text = Program.GetLang("pw_Clear");
		pt_Picture_SelectButton.Text = Program.GetLang("pw_Select");
		toolStripButton1.Text = Program.GetLang("pw_AddNew");
		toolStripButton2.Text = Program.GetLang("pw_Delete");
		dataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Number");
		dataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_SubID");
		dataGridViewTextBoxColumn5.HeaderText = Program.GetLang("pw_Name");
		QRVersion_Label.Text = Program.GetLang("pw_QRVersion") + ":";
		bitmapDataGridViewComboBoxColumn.HeaderText = Program.GetLang("pw_Bitmap");
		printLabel.Text = Program.GetLang("pw_Print_sl_");
		alignLabel.Text = Program.GetLang("pw_Snap_sl_");
		angleLabel.Text = Program.GetLang("pw_Angle_sl_");
		fontLabel.Text = Program.GetLang("pw_Font_sl_");
		heightLabel.Text = Program.GetLang("pw_Height_sl_");
		widthLabel.Text = Program.GetLang("pw_Width_sl_");
		addButton.Text = Program.GetLang("pw_AddNew");
		autoButton.Text = Program.GetLang("pw_AutoAllocation");
		clearButton.Text = Program.GetLang("pw_ClearAll");
		delButton.Text = Program.GetLang("pw_Delete");
		faceLabel.Text = Program.GetLang("pw_Page");
		fontButton.Text = Program.GetLang("pw_Font");
		idCheckBox.Text = Program.GetLang("pw_PLUNo");
		layoutLabel.Text = Program.GetLang("pw_Layout");
		saveButton.Text = Program.GetLang("pw_Picture");
		scaleID_Label.Text = Program.GetLang("pw_ID");
		barF1DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_B1_sl_BarcodeFlag");
		barF2DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_B2_sl_BarcodeFlag");
		barT1DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_B1_sl_BarcodeFormat");
		barT2DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_B2_sl_BarcodeFormat");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorAddNewItem1.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem1.Text = Program.GetLang("pw_Delete");
		bindingNavigatorGoto.Text = Program.GetLang("pw_Switchto");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		classidDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_AffiliatedClass");
		costDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Cost");
		pluidDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Number");
		nameDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Name");
		unitidDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Unit");
		indexDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_IndexBarcode");
		labelID1DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_B1_sl_PrintFormat");
		labelID2DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_B2_sl_PrintFormat");
		priceDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_UPrice");
		remarkDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_ItemCode");
		tareDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Tare");
		taxtextDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_TaxRate");
		taxtypeDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_TaxType");
		text1DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Text1");
		text2DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Text2");
		text3DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Text3");
		text4DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Text4");
		text5DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Text5");
		text6DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Text6");
		text7DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Text7");
		validDataGridViewCheckBoxColumn.HeaderText = Program.GetLang("pw_Import_Export");
		ps_ud_DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_PrintShelfDate");
		pc_ud_DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_ShelfDays");
		im1_ethernet = Image.FromFile(Application.StartupPath + "\\Resources\\Guider_Ethernet_1.png");
		im2_ethernet = Image.FromFile(Application.StartupPath + "\\Resources\\Guider_Ethernet_2.png");
		im1_usb = Image.FromFile(Application.StartupPath + "\\Resources\\Guider_USB_1.png");
		im2_usb = Image.FromFile(Application.StartupPath + "\\Resources\\Guider_USB_2.png");
		export_ethernet_Label.Parent = export_ethernet_PictureBox;
		export_ethernet_Label.Size = export_ethernet_PictureBox.Size;
		export_usb_Label.Parent = export_usb_PictureBox;
		export_usb_Label.Size = export_usb_PictureBox.Size;
		Label label = export_ethernet_Label;
		Point location = (export_usb_Label.Location = new Point(0, 0));
		label.Location = location;
		Label label2 = export_ethernet_Label;
		Font font = (export_usb_Label.Font = new Font(export_usb_Label.Font.FontFamily, export_usb_Label.Size.Width / 10));
		label2.Font = font;
		FindCustom();
		if (custom1Row == null || !custom1Row.Visible)
		{
			sspValue1DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_SSPValue1");
		}
		else
		{
			sspValue1DataGridViewTextBoxColumn.HeaderText = custom1Row.Display;
		}
		if (custom2Row == null || !custom2Row.Visible)
		{
			sspValue2DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_SSPValue2");
		}
		else
		{
			sspValue2DataGridViewTextBoxColumn.HeaderText = custom2Row.Display;
		}
		if (custom3Row == null || !custom3Row.Visible)
		{
			sspValue3DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_SSPValue3");
		}
		else
		{
			sspValue3DataGridViewTextBoxColumn.HeaderText = custom3Row.Display;
		}
		if (custom4Row == null || !custom4Row.Visible)
		{
			sspValue4DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_SSPValue4");
		}
		else
		{
			sspValue4DataGridViewTextBoxColumn.HeaderText = custom4Row.Display;
		}
		if (Device_A08_RadioButton.Text == "#NULL#")
		{
			Device_A08_RadioButton.Visible = false;
		}
		if (Device_A12_RadioButton.Text == "#NULL#")
		{
			Device_A12_RadioButton.Visible = false;
		}
		if (Device_A15_RadioButton.Text == "#NULL#")
		{
			Device_A15_RadioButton.Visible = false;
		}
		if (Device_A17_RadioButton.Text == "#NULL#")
		{
			Device_A17_RadioButton.Visible = false;
		}
		if (Device_A_RadioButton.Text == "#NULL#" || (!Device_A08_RadioButton.Visible && !Device_A12_RadioButton.Visible && !Device_A15_RadioButton.Visible && !Device_A17_RadioButton.Visible))
		{
			RadioButton device_A_RadioButton = Device_A_RadioButton;
			Panel device_Axx_Panel = Device_Axx_Panel;
			bool flag = (Device_Axx_Display_Panel.Visible = false);
			bool visible = (device_Axx_Panel.Visible = flag);
			device_A_RadioButton.Visible = visible;
		}
		if (Device_C11_RadioButton.Text == "#NULL#")
		{
			Device_C11_RadioButton.Visible = false;
		}
		if (Device_C15_RadioButton.Text == "#NULL#")
		{
			Device_C15_RadioButton.Visible = false;
		}
		if (Device_C_RadioButton.Text == "#NULL#" || (!Device_C11_RadioButton.Visible && !Device_C15_RadioButton.Visible))
		{
			RadioButton device_C_RadioButton = Device_C_RadioButton;
			Panel device_Cxx_Panel = Device_Cxx_Panel;
			bool flag4 = (Device_Cxx_Display_Panel.Visible = false);
			bool visible2 = (device_Cxx_Panel.Visible = flag4);
			device_C_RadioButton.Visible = visible2;
		}
		if (Device_B_RadioButton.Text == "#NULL#")
		{
			Device_B_RadioButton.Visible = false;
		}
		if (Device_D_RadioButton.Text == "#NULL#")
		{
			Device_D_RadioButton.Visible = false;
		}
		if (Device_E_RadioButton.Text == "#NULL#")
		{
			Device_E_RadioButton.Visible = false;
		}
		if (Device_F_RadioButton.Text == "#NULL#")
		{
			Device_F_RadioButton.Visible = false;
		}
		wcStep_Enable = new bool[14];
		wcStep_Enable_Plus = new bool[14];
		for (int i = 0; i < wcStep_Enable.Length; i++)
		{
			wcStep_Enable[i] = false;
			wcStep_Enable_Plus[i] = true;
		}
		wcStep_Enable[0] = true;
		wcStep_Enable[13] = true;
		wcStep = WizardConfigStep.DoWhat;
		EnterMenu();
		tableLayoutPanel.Size = new Size(tableLayoutPanel.Size.Width, TE_label.Location.Y);
		TE_label.Visible = false;
		Invalidate();
		string fileName = Application.StartupPath + "\\Combo.xml";
		uIDataSet.ReadXml(fileName);
		string[] array = uIDataSet.SimCombo.FindByName("Shortcut Fuction").ValueDisplay.Split('|');
		ctFuc = new SimComboVD_No[array.Length / 2];
		for (int j = 0; j < array.Length / 2; j++)
		{
			SimComboVD_No simComboVD_No = new SimComboVD_No();
			simComboVD_No.Value = int.Parse(array[j * 2]);
			if (simComboVD_No.Value == 63)
			{
				simComboVD_No.Display = string.Format(array[j * 2 + 1], Program.GetLang_Plus("pw_Payment1"));
			}
			else if (simComboVD_No.Value == 64)
			{
				simComboVD_No.Display = string.Format(array[j * 2 + 1], Program.GetLang_Plus("pw_Payment2"));
			}
			else if (simComboVD_No.Value == 65)
			{
				simComboVD_No.Display = string.Format(array[j * 2 + 1], Program.GetLang_Plus("pw_Payment3"));
			}
			else
			{
				simComboVD_No.Display = array[j * 2 + 1];
			}
			ctFuc[j] = simComboVD_No;
		}
		string fileName2 = Application.StartupPath + "\\Tm.xml";
		uIDataSet.ReadXml(fileName2);
		string fileName3 = Application.StartupPath + "\\LabelItem.xml";
		uIDataSet.ReadXml(fileName3);
		if (Program.LangSocket.Contains("Ramuza"))
		{
			LangSocket_Ramuza();
		}
		BitmapFuc.DataSet_Bitmap_Load_Sim(ref eCSDataSet, ref uIDataSet);
		RDS.DataSet_Init_Unit(ref eCSDataSet);
		labelTableAdapter.Fill(eCSDataSet.Label);
		labelItemTableAdapter.Fill(eCSDataSet.LabelItem);
		barcodeTableAdapter.Fill(eCSDataSet.Barcode);
		stringTableAdapter.Fill(eCSDataSet.String);
		faceListTableAdapter.Fill(eCSDataSet.FaceList);
		faceTableAdapter.Fill(eCSDataSet.Face);
		pluTableAdapter.Fill(eCSDataSet.PLU);
		classTableAdapter.Fill(eCSDataSet.Class);
		BitmapFuc.DataSet_Bitmap_Load_Sim(ref eCSDataSet);
		foreach (ECSDataSet.LabelItemRow item in eCSDataSet.LabelItem)
		{
			item.Display = GetDisplay(item);
		}
		eCSDataSet.LabelItem.AcceptChanges();
		eCSDataSet.LabelItem.ColumnChanging += LabelItem_ColumnChanging;
		BarItemBox = new BarItemBox[32];
		for (int k = 0; k < 32; k++)
		{
			BarItemBox[k] = new BarItemBox(Program.GetLang("pw_Sort") + ":", Program.GetLang("pw_Detail_sl_"), Program.GetLang("pw_Length_sl_"), Program.GetLang("pw_Shift_sl_"), Program.GetLang("pw_Overflow_sl_"), Program.GetLang("pw_Detail_sl_"), Program.GetLang("pw_Source_sl_"), Program.GetLang("pw_Detail_sl_"));
			BarItemBox[k].UserControlBtnClicked += TChar_Changed;
			BarSub_TableLayoutPanel.Controls.Add(BarItemBox[k], 0, 2 + k);
		}
		array = uIDataSet.SimCombo.FindByName("PLU Text").ValueDisplay.Split('|');
		SimComboVD_No[] array2 = new SimComboVD_No[array.Length / 2];
		for (int l = 0; l < array.Length / 2; l++)
		{
			SimComboVD_No simComboVD_No2 = new SimComboVD_No();
			simComboVD_No2.Value = int.Parse(array[l * 2]);
			simComboVD_No2.Display = array[l * 2 + 1];
			array2[l] = simComboVD_No2;
		}
		barcode_Special_PLUInfo_ComboBox.ValueMember = "Value";
		barcode_Special_PLUInfo_ComboBox.DisplayMember = "Display";
		barcode_Special_PLUInfo_ComboBox.DataSource = array2;
		BitmapFuc.DataSet_Bitmap_Load(ref pt_LSP);
		XMLDeserialize();
		pt_Info_Panel.Clear();
		pt_InfoTextSample_Panel.Visible = false;
		array = Program.GetLang("pw_MoneyStringFixed").ToLower().Split('|');
		if (array.Length >= 3 && array[0] == "true")
		{
			TextBox p2_Prefix_textBox = P2_Prefix_textBox;
			bool enabled = (P2_Suffix_textBox.Enabled = false);
			p2_Prefix_textBox.Enabled = enabled;
			P2_Prefix_textBox.Text = array[1];
			P2_Suffix_textBox.Text = array[2];
		}
		for (int m = 0; m < 28; m++)
		{
			tp_Info_TableLayoutPanel.RowStyles.Add(new RowStyle(SizeType.AutoSize));
			Panel panel = new Panel();
			panel.Size = pt_InfoTextSample_Panel.Size;
			panel.Location = pt_InfoTextSample_Panel.Location;
			panel.BorderStyle = pt_InfoTextSample_Panel.BorderStyle;
			pt_Info_Panel.Add(panel);
			Label label3 = new Label();
			panel.Controls.Add(label3);
			label3.AutoSize = true;
			label3.Location = pt_InfoTextSample_Label.Location;
			label3.Text = Program.GetLang("pw_GlobalText") + ": " + uIDataSet.String_Info.FindByStringID(m).Display;
			TextBox textBox = new TextBox();
			panel.Controls.Add(textBox);
			textBox.Multiline = pt_InfoTextSample_TextBox.Multiline;
			textBox.Name = m.ToString();
			textBox.Text = ctSC.PT_GlobalText[m];
			if (ctSC.PT_GlobalText[m] == null)
			{
				textBox.Text = "";
			}
			else
			{
				textBox.Text = ctSC.PT_GlobalText[m];
			}
			textBox.Size = pt_InfoTextSample_TextBox.Size;
			textBox.Location = pt_InfoTextSample_TextBox.Location;
			textBox.Leave += tb2_Leave;
			textBox.KeyPress += tb2_KeyPress;
			tp_Info_TableLayoutPanel.Controls.Add(panel, 0, m + 2);
		}
		for (int n = 0; n < 32; n++)
		{
			tp_Info_TableLayoutPanel.RowStyles.Add(new RowStyle(SizeType.AutoSize));
			Panel panel2 = new Panel();
			panel2.Size = pt_InfoTextSample_Panel.Size;
			panel2.Location = pt_InfoTextSample_Panel.Location;
			panel2.BorderStyle = pt_InfoTextSample_Panel.BorderStyle;
			pt_Info_Panel.Add(panel2);
			Label label4 = new Label();
			panel2.Controls.Add(label4);
			label4.AutoSize = true;
			label4.Location = pt_InfoTextSample_Label.Location;
			label4.Text = Program.GetLang("pw_PrintFormat") + ": " + uIDataSet.LabelItem_Flag1.FindByFlag1(3).Display + n;
			TextBox textBox2 = new TextBox();
			panel2.Controls.Add(textBox2);
			textBox2.Multiline = pt_InfoTextSample_TextBox.Multiline;
			textBox2.Size = pt_InfoTextSample_TextBox.Size;
			textBox2.Location = pt_InfoTextSample_TextBox.Location;
			textBox2.DataBindings.Add("Text", labelBindingSource, "Text" + (n + 1), formattingEnabled: true, DataSourceUpdateMode.OnPropertyChanged);
			textBox2.Leave += tb1_Leave;
			textBox2.KeyPress += tb1_KeyPress;
			tp_Info_TableLayoutPanel.Controls.Add(panel2, 0, n + 2 + 28);
		}
		DataGridViewCellStyle defaultCellStyle = priceDataGridViewTextBoxColumn.DefaultCellStyle;
		string format = (costDataGridViewTextBoxColumn.DefaultCellStyle.Format = "F" + Settings.Default.Format_Price);
		defaultCellStyle.Format = format;
		tareDataGridViewTextBoxColumn.DefaultCellStyle.Format = "F" + Settings.Default.Format_Weight;
		delButton.Enabled = eCSDataSet.FaceList.Count > 1;
		faceComboBox.SelectedIndexChanged += faceComboBox_SelectedIndexChanged;
		layoutComboBox.SelectedIndexChanged += layoutComboBox_SelectedIndexChanged;
		faceListComboBox.SelectedIndexChanged += faceListComboBox_SelectedIndexChanged;
		eCSDataSet.FaceList.FaceListRowChanged += FaceList_FaceListRowChanged;
	}

	private void FaceList_FaceListRowChanged(object sender, ECSDataSet.FaceListRowChangeEvent e)
	{
		if (e.Action == DataRowAction.Rollback || e.Action == DataRowAction.Commit)
		{
			return;
		}
		try
		{
			faceListTableAdapter.Update(eCSDataSet.FaceList);
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void faceComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		if (faceComboBox.SelectedIndex == -1)
		{
			faceComboBox.SelectedValue = Settings.Default.defaultSCP_Page;
			if (faceComboBox.SelectedIndex == -1)
			{
				faceComboBox.SelectedIndex = 0;
			}
		}
		ChangeFace();
	}

	private void layoutComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		if (layoutComboBox.SelectedIndex == -1)
		{
			layoutComboBox.SelectedValue = Settings.Default.defaultSCP;
			if (layoutComboBox.SelectedIndex == -1)
			{
				layoutComboBox.SelectedIndex = 0;
			}
		}
		ChangeFace();
	}

	private void faceListComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		faceListBindingSource.Find("ScaleID", (string)faceListComboBox.SelectedValue);
		Settings.Default.ScFile_ScaleID = (string)faceListComboBox.SelectedValue;
		Settings.Default.Save();
		ChangeFace();
	}

	private void tb1_Leave(object sender, EventArgs e)
	{
		UpdateFlagAll();
	}

	private void tb1_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == '\r')
		{
			UpdateFlagAll();
		}
	}

	private void tb2_Leave(object sender, EventArgs e)
	{
		TextBox textBox = (TextBox)sender;
		int num = Program.ParseInt(textBox.Name, -1);
		if (num >= 0 && num < 28)
		{
			ctSC.PT_GlobalText[num] = textBox.Text;
		}
	}

	private void tb2_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == '\r')
		{
			TextBox textBox = (TextBox)sender;
			int num = Program.ParseInt(textBox.Name, -1);
			if (num >= 0 && num < 28)
			{
				ctSC.PT_GlobalText[num] = textBox.Text;
			}
		}
	}

	private void LabelItem_ColumnChanging(object sender, DataColumnChangeEventArgs e)
	{
		if ((!(e.Column.Caption != "SubID") || !(e.Column.Caption != "LabelID")) && e.Column.Caption == "SubID")
		{
			int num = (int)e.ProposedValue;
			if ((num > Settings.Default.maxLabelItemID || num < 0) && !subid_changing)
			{
				e.ProposedValue = e.Row["SubID"];
			}
		}
	}

	private void WizardForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		eCSDataSet.FaceList.FaceListRowChanged -= FaceList_FaceListRowChanged;
		faceComboBox.SelectedIndexChanged -= faceComboBox_SelectedIndexChanged;
		layoutComboBox.SelectedIndexChanged -= layoutComboBox_SelectedIndexChanged;
		faceListComboBox.SelectedIndexChanged -= faceListComboBox_SelectedIndexChanged;
		DataSet_Update("Label");
		DataSet_Update("Barcode");
		DataSet_Update("PLU");
		DataSet_Update("Face");
		eCSDataSet.LabelItem.ColumnChanging -= LabelItem_ColumnChanging;
	}

	private void HideAll()
	{
		foreach (Control control in tableLayoutPanel.Controls)
		{
			if (control is Panel panel && panel.Size == device_Panel.Size)
			{
				panel.Visible = false;
			}
		}
	}

	private void EnterMenu()
	{
		HideAll();
		Button previous_button = Previous_button;
		bool visible = (Previous_button.Enabled = wcStep != WizardConfigStep.DoWhat);
		previous_button.Visible = visible;
		Button next_button = Next_button;
		bool visible2 = (Next_button.Enabled = wcStep != WizardConfigStep.TMSout);
		next_button.Visible = visible2;
		NextDisable_Label.Visible = false;
		if (wcStep == WizardConfigStep.DoWhat)
		{
			Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_WhatToDo");
			opMain_Panel.Visible = true;
			return;
		}
		if (wcStep == WizardConfigStep.Device)
		{
			Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_SelectDevice");
			device_Panel.Visible = true;
			return;
		}
		if (wcStep == WizardConfigStep.OperationMode)
		{
			Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_OperationMode");
			if (Device_A_RadioButton.Checked || Device_F_RadioButton.Checked)
			{
				Mode_LabelPrint_RadioButton.Enabled = true;
				Mode_PlainPapper_Panel.Enabled = true;
			}
			else
			{
				Mode_LabelPrint_RadioButton.Enabled = false;
				Mode_PlainPapper_Panel.Enabled = false;
				Mode_CashRegister_RadioButton.Checked = true;
				Mode_PlainPaper57_RadioButton.Checked = true;
			}
			mode_Panel.Visible = true;
			return;
		}
		if (wcStep == WizardConfigStep.PT_1 || wcStep == WizardConfigStep.PT_2 || wcStep == WizardConfigStep.PT_3)
		{
			pt_Editing = false;
			PT_Edit_Check();
			int num;
			int num2;
			int num3;
			if (wcStep == WizardConfigStep.PT_1)
			{
				Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_PrintFormatOfItemLabel");
				no_PTCloneTo = Settings.Default.suggestUserLabelID - 1;
				num = ctSC.PT_ItemLabel;
				if (ctSC.Mode_GapPaperType == 6040)
				{
					num2 = 11000;
					num3 = 11099;
				}
				else if (ctSC.Mode_GapPaperType == 4030)
				{
					num2 = 11100;
					num3 = 11199;
				}
				else if (ctSC.Mode_GapPaperType == 6030)
				{
					num2 = 11200;
					num3 = 11299;
				}
				else if (ctSC.Mode_GapPaperType == 3040)
				{
					num2 = 11300;
					num3 = 11399;
				}
				else
				{
					num2 = 11000;
					num3 = 11999;
				}
			}
			else if (wcStep == WizardConfigStep.PT_2)
			{
				Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_PrintFormatOfSumLabel");
				no_PTCloneTo = Settings.Default.suggestUserLabelID;
				num = ctSC.PT_SumLabel;
				if (ctSC.Mode_GapPaperType == 6040)
				{
					num2 = 12000;
					num3 = 12099;
				}
				else if (ctSC.Mode_GapPaperType == 4030)
				{
					num2 = 12100;
					num3 = 12199;
				}
				else if (ctSC.Mode_GapPaperType == 6030)
				{
					num2 = 12200;
					num3 = 12299;
				}
				else if (ctSC.Mode_GapPaperType == 3040)
				{
					num2 = 12300;
					num3 = 12399;
				}
				else
				{
					num2 = 12000;
					num3 = 12999;
				}
			}
			else if (wcStep == WizardConfigStep.PT_3)
			{
				Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_PrintFormatOfReceipt");
				no_PTCloneTo = Settings.Default.suggestUserLabelID - 2;
				num = ctSC.PT_Receipt;
				if (ctSC.Mode_PlainPaperType == 57)
				{
					num2 = 13000;
					num3 = 13099;
				}
				else if (ctSC.Mode_PlainPaperType == 40)
				{
					num2 = 13100;
					num3 = 13199;
				}
				else if (ctSC.Mode_PlainPaperType == 60)
				{
					num2 = 13200;
					num3 = 13299;
				}
				else
				{
					num2 = 13000;
					num3 = 13999;
				}
			}
			else
			{
				Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_PrintFormat");
				no_PTCloneTo = Settings.Default.suggestUserLabelID - 3;
				num = 0;
				num2 = Settings.Default.minLabelID_Template;
				num3 = Settings.Default.maxLabelID_Template;
			}
			pt_Panel.Visible = true;
			labelBindingSource.Filter = string.Format("((LabelID >=1 AND LabelID < {2}) OR (LabelID >={0} AND LabelID<={1}))", num2, num3, Settings.Default.minLabelID_Template, Settings.Default.maxLabelID_Template);
			int num4 = labelBindingSource.Find("LabelID", num);
			if (num4 != -1)
			{
				labelBindingSource.Position = num4;
			}
			else
			{
				labelBindingSource.Position = 0;
			}
			labelBindingSource_PositionChanged();
			labelnext();
			{
				foreach (DataGridViewRow item in (IEnumerable)labelitemDataGridView.Rows)
				{
					item.Selected = false;
				}
				return;
			}
		}
		if (wcStep == WizardConfigStep.Barcode)
		{
			barcode_panel.Visible = true;
			Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_Barcode");
			P1_TypeX_radioButton_CheckedChanged(null, null);
			P1_Part6_xxxxDecimal_NumericUpDown_ValueChanged(null, null);
			int num5 = 6;
			string text = (TChar_TextBox.Text = ctSC.Barcode_ME_Source);
			string Sin = text;
			for (int i = 0; i < 32; i++)
			{
				TChar_In = true;
				BarItemBox[i].BarInit(ref Sin);
				TChar_In = false;
				if (BarItemBox[i].GetN1() != 0)
				{
					num5 = i + 1;
				}
			}
			if (num5 < 6)
			{
				num5 = 6;
			}
			BarNum_NumericUpDown.Value = num5;
			BarNum_NumericUpDown_ValueChanged();
		}
		else if (wcStep == WizardConfigStep.Management)
		{
			manage_panel.Visible = true;
			Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_Management");
		}
		else if (wcStep == WizardConfigStep.SaleOpConfig)
		{
			opconfig_panel.Visible = true;
			Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_SaleOperation");
		}
		else if (wcStep == WizardConfigStep.Unit)
		{
			unit_panel.Visible = true;
			Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_Unit");
		}
		else if (wcStep == WizardConfigStep.W5th)
		{
			w5th_panel.Visible = true;
			Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_DisplayOf5thWindows");
		}
		else if (wcStep == WizardConfigStep.PLU)
		{
			plu_panel.Visible = true;
			plu_part_CheckedChanged();
			Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_PLU");
		}
		else if (wcStep == WizardConfigStep.Face)
		{
			face_panel.Visible = true;
			try
			{
				faceListBindingSource.Find("ScaleID", ctSC.SCP_ScaleID);
				faceListComboBox.SelectedValue = ctSC.SCP_ScaleID;
				if (faceListComboBox.SelectedIndex == -1)
				{
					faceListComboBox.SelectedIndex = 0;
				}
				ECSDataSet.FaceListRow faceListRow = eCSDataSet.FaceList.FindByScaleID((string)faceListComboBox.SelectedValue);
				if (ctSC.Device == "B")
				{
					layoutComboBox.SelectedValue = "ScPLU_KB";
				}
				else if (ctSC.Device == "C11" || ctSC.Device == "C15")
				{
					layoutComboBox.SelectedValue = "ScPLU_KC";
				}
				else if (ctSC.Device == "D")
				{
					layoutComboBox.SelectedValue = "ScPLU_KD";
				}
				else if (ctSC.Device == "E")
				{
					layoutComboBox.SelectedValue = "ScPLU_KE";
				}
				else if (ctSC.Device == "F")
				{
					layoutComboBox.SelectedValue = "ScPLU_KF";
				}
				else if (ctSC.Device == "A08")
				{
					layoutComboBox.SelectedValue = "ScPLU_KA";
				}
				else if (ctSC.Device_A == "np")
				{
					layoutComboBox.SelectedValue = "ScPLU_KAD";
				}
				else
				{
					layoutComboBox.SelectedValue = "ScPLU_KAB";
				}
				faceComboBox.SelectedValue = faceListRow.PageMode;
				if (faceComboBox.SelectedIndex == -1)
				{
					faceComboBox.SelectedValue = ctSC.SCP_Page;
				}
			}
			catch (Exception)
			{
			}
			_font = ctSC.SCP_Font;
			_idFont = new Font(Font.FontFamily, 9f);
			ChangeFace();
			Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_Shortcutkey");
		}
		else if (wcStep == WizardConfigStep.TMSout)
		{
			tmsout_panel.Visible = true;
			if (!OpMain_TMSout_radioButton.Checked)
			{
				ctSC.wcStep = new bool[14];
				for (int j = 0; j < 14; j++)
				{
					if (wcStep_Enable[j] && wcStep_Enable_Plus[j])
					{
						ctSC.wcStep[j] = true;
					}
					else
					{
						ctSC.wcStep[j] = false;
					}
				}
			}
			Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_Export_ToDevice_");
			export_ethernet_PictureBox_MouseLeave(null, null);
			export_usb_PictureBox_MouseLeave(null, null);
			XMLSerialize();
		}
		else
		{
			Text = Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_Unkown Error");
		}
	}

	private void export_ethernet_PictureBox_MouseEnter(object sender, EventArgs e)
	{
		export_ethernet_PictureBox.Image = im2_ethernet;
		export_ethernet_Label.ForeColor = Color.Red;
	}

	private void export_ethernet_PictureBox_MouseLeave(object sender, EventArgs e)
	{
		export_ethernet_PictureBox.Image = im1_ethernet;
		export_ethernet_Label.ForeColor = SystemColors.ControlText;
	}

	private void export_usb_PictureBox_MouseEnter(object sender, EventArgs e)
	{
		export_usb_PictureBox.Image = im2_usb;
		export_usb_Label.ForeColor = Color.Red;
	}

	private void export_usb_PictureBox_MouseLeave(object sender, EventArgs e)
	{
		export_usb_PictureBox.Image = im1_usb;
		export_usb_Label.ForeColor = SystemColors.ControlText;
	}

	private void export_ethernet_PictureBox_Click(object sender, EventArgs e)
	{
		Program.mf.PopMdiChild_Ethernet_Hold(Wizard: true, Spec: false, String: false, Barcode: false, ctSC.wcStep[2], ctSC.wcStep[11], ctSC.wcStep[12], Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false, VIP: false, ctSC.PT_Bitmap_Used);
		Close();
	}

	private void export_usb_PictureBox_Click(object sender, EventArgs e)
	{
		Hide();
		Program.mf.ShowDialog_TMSfile_Hold(Wizard: true, Spec: false, String: false, Barcode: false, ctSC.wcStep[2], ctSC.wcStep[11], ctSC.wcStep[12], Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false, VIP: false, ctSC.PT_Bitmap_Used);
		Close();
	}

	private int LabelItem_Pos(ECSDataSet.LabelItemRow row)
	{
		int num = row.Left + 1;
		if (num > 9999)
		{
			num = 9999;
		}
		else if (num < 1)
		{
			num = 1;
		}
		if (row.Flag1 == 5)
		{
			return row.Top * 10000;
		}
		if (row.Angle == 2 || row.Angle == 3)
		{
			return row.Top * 10000 - num;
		}
		return row.Top * 10000 + num;
	}

	public void SaveLabel()
	{
		Validate();
		try
		{
			labelBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			labelBindingSource.CancelEdit();
		}
		try
		{
			labelItemBindingSource.EndEdit();
		}
		catch (Exception ex2)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			labelItemBindingSource.CancelEdit();
		}
		if (!eCSDataSet.HasChanges())
		{
			return;
		}
		if (Settings.Default.fucLabelReID)
		{
			foreach (ECSDataSet.LabelRow item in eCSDataSet.Label)
			{
				if (item.RowState == DataRowState.Deleted || item.RowState == DataRowState.Detached)
				{
					continue;
				}
				ECSDataSet.LabelItemRow[] labelItemRows = item.GetLabelItemRows();
				for (int i = 0; i < labelItemRows.Length - 1; i++)
				{
					if (labelItemRows[i].RowState == DataRowState.Deleted || labelItemRows[i].RowState == DataRowState.Detached)
					{
						continue;
					}
					int num = i;
					int subID = labelItemRows[i].SubID;
					int num2 = i;
					int num3 = LabelItem_Pos(labelItemRows[i]);
					for (int j = i + 1; j < labelItemRows.Length; j++)
					{
						if (labelItemRows[j].RowState != DataRowState.Deleted && labelItemRows[j].RowState != DataRowState.Detached)
						{
							if (LabelItem_Pos(labelItemRows[j]) < num3)
							{
								num2 = j;
								num3 = LabelItem_Pos(labelItemRows[j]);
							}
							if (labelItemRows[j].SubID < subID)
							{
								num = j;
								subID = labelItemRows[j].SubID;
							}
						}
					}
					if (num2 != i)
					{
						object[] itemArray = labelItemRows[i].ItemArray;
						object[] itemArray2 = labelItemRows[num2].ItemArray;
						object obj = itemArray[1];
						itemArray[1] = itemArray2[1];
						itemArray2[1] = obj;
						labelItemRows[num2].ItemArray = itemArray;
						labelItemRows[i].ItemArray = itemArray2;
					}
					if (num != i)
					{
						int subID2 = labelItemRows[num].SubID;
						int subID3 = labelItemRows[i].SubID;
						subid_changing = true;
						labelItemRows[i].SubID = -1;
						labelItemRows[num].SubID = subID3;
						labelItemRows[i].SubID = subID2;
						subid_changing = false;
					}
				}
			}
		}
		try
		{
			labelTableAdapter.Update(eCSDataSet.Label);
			labelItemTableAdapter.Update(eCSDataSet.LabelItem);
		}
		catch (Exception ex3)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex3.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void LeaveMenu(bool next)
	{
		if (wcStep == WizardConfigStep.DoWhat)
		{
			wcStep_Enable[1] = false;
			wcStep_Enable[11] = false;
			wcStep_Enable[12] = false;
			if (OpMain_FirstConfig_radioButton.Checked)
			{
				string[] array = Program.GetLang("pw_Z_ConfigWizard_DeviceMenu").Split('|');
				wcStep_Enable[1] = array[0] != "false";
				wcStep_Enable[11] = OpMain_PLU_CheckBox.Checked;
				wcStep_Enable[12] = OpMain_SCP_CheckBox.Checked;
				if (!wcStep_Enable[1])
				{
					wcStep_Enable[2] = OpMain_LabelBarcode_CheckBox.Checked;
					wcStep_Enable[6] = OpMain_LabelBarcode_CheckBox.Checked;
					wcStep_Enable[7] = OpMain_Management_CheckBox.Checked;
					wcStep_Enable[8] = OpMain_SaleOperation_CheckBox.Checked;
					wcStep_Enable[9] = OpMain_UnitDisplay_CheckBox.Checked;
					if (((ctSC.Device == "A08" || ctSC.Device == "A12" || ctSC.Device == "A15" || ctSC.Device == "A17") && (ctSC.Device_A == "5w" || ctSC.Device_A == "np")) || ((ctSC.Device == "C11" || ctSC.Device == "C15") && (ctSC.Device_C == "5w" || ctSC.Device_C == "np")) || ctSC.Device == "E" || ctSC.Device == "F")
					{
						wcStep_Enable[10] = OpMain_UnitDisplay_CheckBox.Checked;
					}
					else
					{
						wcStep_Enable[10] = false;
					}
					wcStep_Enable_Plus[6] = false;
					ctSC.Barcode_ED = false;
					for (int i = 0; i < ctSC.PT_GlobalText_ED.Length; i++)
					{
						ctSC.PT_GlobalText_ED[i] = false;
					}
					ctSC.PT_Bitmap_Used = false;
					bool[] array2 = wcStep_Enable;
					bool flag;
					wcStep_Enable[4] = (flag = (wcStep_Enable[5] = false));
					array2[3] = flag;
				}
			}
			else if (OpMain_WorkData_radioButton.Checked)
			{
				wcStep_Enable[11] = true;
				wcStep_Enable[12] = true;
			}
		}
		else if (wcStep == WizardConfigStep.Device)
		{
			wcStep_Enable[2] = OpMain_LabelBarcode_CheckBox.Checked;
			wcStep_Enable[6] = OpMain_LabelBarcode_CheckBox.Checked;
			wcStep_Enable[7] = OpMain_Management_CheckBox.Checked;
			wcStep_Enable[8] = OpMain_SaleOperation_CheckBox.Checked;
			wcStep_Enable[9] = OpMain_UnitDisplay_CheckBox.Checked;
			if (((ctSC.Device == "A08" || ctSC.Device == "A12" || ctSC.Device == "A15" || ctSC.Device == "A17") && (ctSC.Device_A == "5w" || ctSC.Device_A == "np")) || ((ctSC.Device == "C11" || ctSC.Device == "C15") && (ctSC.Device_C == "5w" || ctSC.Device_C == "np")) || ctSC.Device == "E" || ctSC.Device == "F")
			{
				wcStep_Enable[10] = OpMain_UnitDisplay_CheckBox.Checked;
			}
			else
			{
				wcStep_Enable[10] = false;
			}
			wcStep_Enable_Plus[6] = false;
			ctSC.Barcode_ED = false;
			for (int j = 0; j < ctSC.PT_GlobalText_ED.Length; j++)
			{
				ctSC.PT_GlobalText_ED[j] = false;
			}
			ctSC.PT_Bitmap_Used = false;
			bool[] array3 = wcStep_Enable;
			bool flag2;
			wcStep_Enable[4] = (flag2 = (wcStep_Enable[5] = false));
			array3[3] = flag2;
		}
		else if (wcStep == WizardConfigStep.OperationMode)
		{
			bool[] array4 = wcStep_Enable;
			bool flag3;
			wcStep_Enable[4] = (flag3 = (wcStep_Enable[5] = false));
			array4[3] = flag3;
			if (Mode_LabelPrint_RadioButton.Checked)
			{
				wcStep_Enable[3] = OpMain_LabelBarcode_CheckBox.Checked;
				if (!Mode_OneItemOnly_checkBox.Checked)
				{
					wcStep_Enable[4] = OpMain_LabelBarcode_CheckBox.Checked;
				}
				return;
			}
			wcStep_Enable[5] = OpMain_LabelBarcode_CheckBox.Checked;
			if (Mode_ScanInternalBarcode_checkBox.Checked)
			{
				wcStep_Enable_Plus[6] = true;
				ctSC.Barcode_ED = true;
			}
		}
		else if (wcStep == WizardConfigStep.PT_1 || wcStep == WizardConfigStep.PT_2 || wcStep == WizardConfigStep.PT_3)
		{
			if (next)
			{
				PT_Clone();
				SaveLabel();
			}
			ECSDataSet.LabelRow currentRow = GetCurrentRow();
			if (currentRow == null)
			{
				return;
			}
			ECSDataSet.LabelItemRow[] labelItemRows = currentRow.GetLabelItemRows();
			foreach (ECSDataSet.LabelItemRow labelItemRow in labelItemRows)
			{
				if (labelItemRow.Flag1 == 2)
				{
					if (labelItemRow.Flag2 <= 1)
					{
						ctSC.PT_GlobalText_ED[labelItemRow.Flag2] = true;
					}
					else if (labelItemRow.Flag2 >= 17 && labelItemRow.Flag2 < 25)
					{
						ctSC.PT_GlobalText_ED[labelItemRow.Flag2 - 17 + 4] = true;
					}
					else if (labelItemRow.Flag2 >= 36 && labelItemRow.Flag2 < 44)
					{
						ctSC.PT_GlobalText_ED[labelItemRow.Flag2 - 36 + 12] = true;
					}
				}
				if (labelItemRow.Flag1 == 6 && labelItemRow.Flag2 < ctSC.PT_GlobalText_ED.Length)
				{
					ctSC.PT_GlobalText_ED[labelItemRow.Flag2] = true;
				}
				if (!wcStep_Enable_Plus[6] && labelItemRow.Flag1 == 0)
				{
					wcStep_Enable_Plus[6] = true;
					ctSC.Barcode_ED = true;
				}
				if (labelItemRow.Flag1 == 6)
				{
					ctSC.PT_Bitmap_Used = true;
				}
			}
		}
		else if (wcStep == WizardConfigStep.Barcode)
		{
			ctSC.Barcode_ME_Source = TChar_TextBox.Text;
		}
		else if (wcStep != WizardConfigStep.Management && wcStep != WizardConfigStep.SaleOpConfig && wcStep != WizardConfigStep.Unit && wcStep != WizardConfigStep.W5th)
		{
			if (wcStep == WizardConfigStep.PLU)
			{
				pLUDataGridView.EndEdit();
				pLUBindingSource.EndEdit();
				pluTableAdapter.Update(eCSDataSet.PLU);
			}
			else if (wcStep == WizardConfigStep.Face)
			{
				faceTableAdapter.Update(eCSDataSet.Face);
			}
			else
			{
				_ = wcStep;
				_ = 13;
			}
		}
	}

	private void NextMenu()
	{
		LeaveMenu(next: true);
		Next_button.Text = Program.GetLang("pw_Next");
		int num = (int)wcStep;
		while (true)
		{
			if (num == 13)
			{
				wcStep = WizardConfigStep.TMSout;
				break;
			}
			num++;
			if (wcStep_Enable[num] && wcStep_Enable_Plus[num])
			{
				wcStep = (WizardConfigStep)num;
				break;
			}
		}
		EnterMenu();
	}

	private void PreviousMenu()
	{
		LeaveMenu(next: false);
		Next_button.Text = Program.GetLang("pw_Next");
		int num = (int)wcStep;
		while (true)
		{
			if (num == 0)
			{
				wcStep = WizardConfigStep.DoWhat;
				break;
			}
			num--;
			if (wcStep_Enable[num] && wcStep_Enable_Plus[num])
			{
				wcStep = (WizardConfigStep)num;
				break;
			}
		}
		EnterMenu();
	}

	private void Previous_button_Click(object sender, EventArgs e)
	{
		PreviousMenu();
	}

	private void Next_button_Click(object sender, EventArgs e)
	{
		NextMenu();
	}

	private ECSDataSet.LabelItemRow GetCurrentItemRow()
	{
		if (labelItemBindingSource.Position == -1)
		{
			return null;
		}
		DataRowView dataRowView = (DataRowView)labelItemBindingSource.Current;
		return (ECSDataSet.LabelItemRow)dataRowView.Row;
	}

	private ECSDataSet.PLURow GetCurrentPLURow()
	{
		if (pLUBindingSource.Position == -1)
		{
			return null;
		}
		DataRowView dataRowView = (DataRowView)pLUBindingSource.Current;
		return (ECSDataSet.PLURow)dataRowView.Row;
	}

	private ECSDataSet.LabelRow GetCurrentRow()
	{
		if (labelBindingSource.Position == -1)
		{
			return null;
		}
		DataRowView dataRowView = (DataRowView)labelBindingSource.Current;
		return (ECSDataSet.LabelRow)dataRowView.Row;
	}

	private void DrawItem(Graphics g, ECSDataSet.LabelRow row, ECSDataSet.LabelItemRow itemRow, bool current)
	{
		if (itemRow.Flag1 == 5)
		{
			using (Pen pen = new Pen(Color.Black, (!current) ? 1 : 2))
			{
				g.DrawLine(pen, new Point(0, itemRow.Top), new Point(row.Width, itemRow.Top));
			}
			if (current)
			{
				rcCur = new Rectangle(0, itemRow.Top - 5, row.Width, 10);
				rcLeftTop = (rcLeftBottom = (rcRightTop = (rcRightBottom = (rcLeft = (rcRight = (rcTop = (rcBottom = Rectangle.Empty)))))));
			}
			return;
		}
		g.TranslateTransform(itemRow.Left, itemRow.Top);
		float angle = 0f;
		switch (itemRow.Angle)
		{
		case 1:
			angle = 90f;
			break;
		case 2:
			angle = 180f;
			break;
		case 3:
			angle = 270f;
			break;
		}
		g.RotateTransform(angle);
		Rectangle rect = new Rectangle(0, 0, itemRow.Width, itemRow.Height);
		g.FillRectangle(Brushes.WhiteSmoke, rect);
		g.DrawRectangle(Pens.Black, rect);
		FontFamily fontFamily = Font.FontFamily;
		float emSize = Font.Size;
		if (!row.IsVersionNull())
		{
			if (row.Version == 0)
			{
				UIDataSet.LabelItem_Font1Row labelItem_Font1Row = uIDataSet.LabelItem_Font1.FindByValue(itemRow.Font);
				if (labelItem_Font1Row != null)
				{
					emSize = labelItem_Font1Row.Size;
				}
			}
			else if (row.Version == 1)
			{
				UIDataSet.LabelItem_Font2Row labelItem_Font2Row = uIDataSet.LabelItem_Font2.FindByValue(itemRow.Font);
				if (labelItem_Font2Row != null)
				{
					emSize = labelItem_Font2Row.Size;
				}
			}
		}
		Font font = new Font(fontFamily, emSize);
		StringFormat stringFormat = new StringFormat();
		switch (itemRow.Align)
		{
		case 1:
			stringFormat.Alignment = StringAlignment.Near;
			stringFormat.LineAlignment = StringAlignment.Near;
			break;
		case 2:
			stringFormat.Alignment = StringAlignment.Center;
			stringFormat.LineAlignment = StringAlignment.Near;
			break;
		case 3:
			stringFormat.Alignment = StringAlignment.Far;
			stringFormat.LineAlignment = StringAlignment.Near;
			break;
		case 4:
			stringFormat.Alignment = StringAlignment.Near;
			stringFormat.LineAlignment = StringAlignment.Center;
			break;
		case 0:
		case 5:
			stringFormat.Alignment = StringAlignment.Center;
			stringFormat.LineAlignment = StringAlignment.Center;
			break;
		case 6:
			stringFormat.Alignment = StringAlignment.Far;
			stringFormat.LineAlignment = StringAlignment.Center;
			break;
		case 7:
			stringFormat.Alignment = StringAlignment.Near;
			stringFormat.LineAlignment = StringAlignment.Far;
			break;
		case 8:
			stringFormat.Alignment = StringAlignment.Center;
			stringFormat.LineAlignment = StringAlignment.Far;
			break;
		case 9:
			stringFormat.Alignment = StringAlignment.Far;
			stringFormat.LineAlignment = StringAlignment.Far;
			break;
		}
		string display = itemRow.Display;
		g.DrawString(display, font, Brushes.Black, new RectangleF(0f, 0f, itemRow.Width, itemRow.Height), stringFormat);
		if (current)
		{
			int left = itemRow.Left;
			int top = itemRow.Top;
			int num = itemRow.Width;
			int num2 = itemRow.Height;
			rcCur = GetRealRect(new Rectangle(left, top, num, num2), itemRow.Angle);
			rcLeftTop = new Rectangle(rcCur.Left - 5, rcCur.Top - 5, 6, 6);
			rcLeftBottom = new Rectangle(rcCur.Left - 5, rcCur.Bottom - 1, 6, 6);
			rcRightTop = new Rectangle(rcCur.Right - 1, rcCur.Top - 5, 6, 6);
			rcRightBottom = new Rectangle(rcCur.Right - 1, rcCur.Bottom - 1, 6, 6);
			rcLeft = new Rectangle(rcCur.Left - 5, rcCur.Top + rcCur.Height / 2 - 2, 6, 6);
			rcRight = new Rectangle(rcCur.Right - 1, rcCur.Top + rcCur.Height / 2 - 2, 6, 6);
			rcTop = new Rectangle(rcCur.Left + rcCur.Width / 2 - 2, rcCur.Top - 5, 6, 6);
			rcBottom = new Rectangle(rcCur.Left + rcCur.Width / 2 - 2, rcCur.Bottom - 1, 6, 6);
			g.FillRectangle(Brushes.Black, new Rectangle(num - 1, -5, 6, 6));
			g.FillRectangle(Brushes.Black, new Rectangle(-5, -5, 6, 6));
			g.FillRectangle(Brushes.Black, new Rectangle(-5, num2 - 1, 6, 6));
			g.FillRectangle(Brushes.Black, new Rectangle(num - 1, num2 - 1, 6, 6));
			g.FillRectangle(Brushes.Black, new Rectangle(-5, num2 / 2 - 2, 6, 6));
			g.FillRectangle(Brushes.Black, new Rectangle(num - 1, num2 / 2 - 2, 6, 6));
			g.FillRectangle(Brushes.Black, new Rectangle(num / 2 - 2, -5, 6, 6));
			g.FillRectangle(Brushes.Black, new Rectangle(num / 2 - 2, num2 - 1, 6, 6));
		}
		g.ResetTransform();
	}

	private Rectangle RT_all(int x, int y, int w, int h)
	{
		if (w < 0)
		{
			x += w;
			w = -w;
		}
		if (h < 0)
		{
			y += h;
			h = -h;
		}
		return new Rectangle(x, y, w, h);
	}

	private static Rectangle GetRealRect(Rectangle rc, int angle)
	{
		return angle switch
		{
			1 => new Rectangle(rc.Left - rc.Height, rc.Top, rc.Height, rc.Width), 
			2 => new Rectangle(rc.Left - rc.Width, rc.Top - rc.Height, rc.Width, rc.Height), 
			3 => new Rectangle(rc.Left, rc.Top - rc.Width, rc.Height, rc.Width), 
			_ => rc, 
		};
	}

	private void subPanel_Paint(object sender, PaintEventArgs e)
	{
		Graphics graphics = e.Graphics;
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (currentRow == null)
		{
			subPanel.Width = 360;
			subPanel.Height = 270;
			graphics.Clear(Color.Gray);
			return;
		}
		subPanel.Width = currentRow.Width;
		subPanel.Height = currentRow.Height;
		graphics.Clear(Color.White);
		graphics.SmoothingMode = SmoothingMode.HighQuality;
		ECSDataSet.LabelItemRow currentItemRow = GetCurrentItemRow();
		foreach (DataRowView item in labelItemBindingSource)
		{
			ECSDataSet.LabelItemRow labelItemRow = (ECSDataSet.LabelItemRow)item.Row;
			if (labelItemRow.RowState == DataRowState.Detached || labelItemRow.RowState == DataRowState.Deleted || labelItemRow == currentItemRow)
			{
				continue;
			}
			DataGridViewRow dataGridViewRow = null;
			foreach (DataGridViewRow item2 in (IEnumerable)labelitemDataGridView.Rows)
			{
				if (item2.DataBoundItem is DataRowView dataRowView2 && labelItemRow.SubID == (int)dataRowView2.Row.ItemArray[1])
				{
					dataGridViewRow = item2;
					break;
				}
			}
			DrawItem(graphics, currentRow, labelItemRow, dataGridViewRow?.Selected ?? false);
		}
		if (currentItemRow != null)
		{
			DrawItem(graphics, currentRow, currentItemRow, current: true);
		}
		if (_dragState == DragState.Select && (_diffX != 0 || _diffY != 0))
		{
			Rectangle rect = RT_all(_ptStart.X, _ptStart.Y, _diffX, _diffY);
			Pen pen = new Pen(Color.Black);
			float[] dashPattern = new float[2] { 2f, 3f };
			pen.DashPattern = dashPattern;
			graphics.DrawRectangle(pen, rect);
		}
		rcLabelBottom = new Rectangle(currentRow.Width / 2 - 2, currentRow.Height - 5, 5, 5);
		rcLabelRight = new Rectangle(currentRow.Width - 5, currentRow.Height / 2 - 2, 5, 5);
		rcLabelRightBottom = new Rectangle(currentRow.Width - 5, currentRow.Height - 5, 5, 5);
		graphics.FillRectangle(Brushes.Black, rcLabelBottom);
		graphics.FillRectangle(Brushes.Black, rcLabelRight);
		graphics.FillRectangle(Brushes.Black, rcLabelRightBottom);
	}

	private void subPanel_MouseDown(object sender, MouseEventArgs e)
	{
		labelitemDataGridView.Focus();
		ECSDataSet.LabelItemRow currentItemRow = GetCurrentItemRow();
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (currentRow == null)
		{
			return;
		}
		if (rcLabelBottom.Contains(e.X, e.Y))
		{
			_dragState = DragState.LabelBottom;
			_labelHeight = currentRow.Height;
		}
		else if (rcLabelRight.Contains(e.X, e.Y))
		{
			_dragState = DragState.LabelRight;
			_labelWidth = currentRow.Width;
		}
		else if (rcLabelRightBottom.Contains(e.X, e.Y))
		{
			_dragState = DragState.LabelRightBottom;
			_labelWidth = currentRow.Width;
			_labelHeight = currentRow.Height;
		}
		else
		{
			if (currentItemRow == null)
			{
				return;
			}
			if (rcLeftTop.Contains(e.X, e.Y))
			{
				_dragState = DragState.LeftTop;
			}
			else if (rcRightBottom.Contains(e.X, e.Y))
			{
				_dragState = DragState.RightBottom;
			}
			else if (rcLeftBottom.Contains(e.X, e.Y))
			{
				_dragState = DragState.LeftBottom;
			}
			else if (rcRightTop.Contains(e.X, e.Y))
			{
				_dragState = DragState.RightTop;
			}
			else if (rcLeft.Contains(e.X, e.Y))
			{
				_dragState = DragState.Left;
			}
			else if (rcRight.Contains(e.X, e.Y))
			{
				_dragState = DragState.Right;
			}
			else if (rcTop.Contains(e.X, e.Y))
			{
				_dragState = DragState.Top;
			}
			else if (rcBottom.Contains(e.X, e.Y))
			{
				_dragState = DragState.Bottom;
			}
			else
			{
				if (!rcCur.Contains(e.X, e.Y))
				{
					currentItemRow = null;
					_list.Clear();
					foreach (DataGridViewRow selectedRow in labelitemDataGridView.SelectedRows)
					{
						_list.Add((int)selectedRow.Cells[0].Value);
					}
					foreach (DataRowView item in labelItemBindingSource)
					{
						ECSDataSet.LabelItemRow labelItemRow = (ECSDataSet.LabelItemRow)item.Row;
						if (labelItemRow.RowState != DataRowState.Detached && labelItemRow.RowState != DataRowState.Deleted && _list.Contains(labelItemRow.SubID) && ((labelItemRow.Flag1 != 5) ? GetRealRect(new Rectangle(labelItemRow.Left, labelItemRow.Top, labelItemRow.Width, labelItemRow.Height), labelItemRow.Angle) : new Rectangle(0, labelItemRow.Top - 5, currentRow.Width, 10)).Contains(e.X, e.Y))
						{
							currentItemRow = labelItemRow;
							_list_ct = currentItemRow.SubID;
							break;
						}
					}
					if (currentItemRow == null)
					{
						foreach (DataRowView item2 in labelItemBindingSource)
						{
							ECSDataSet.LabelItemRow labelItemRow2 = (ECSDataSet.LabelItemRow)item2.Row;
							if (labelItemRow2.RowState != DataRowState.Detached && labelItemRow2.RowState != DataRowState.Deleted && ((labelItemRow2.Flag1 != 5) ? GetRealRect(new Rectangle(labelItemRow2.Left, labelItemRow2.Top, labelItemRow2.Width, labelItemRow2.Height), labelItemRow2.Angle) : new Rectangle(0, labelItemRow2.Top - 5, currentRow.Width, 10)).Contains(e.X, e.Y))
							{
								currentItemRow = labelItemRow2;
								_list_ct = currentItemRow.SubID;
								if (!bMulti_C && !bMulti_S)
								{
									_list.Clear();
								}
								break;
							}
						}
					}
					if (currentItemRow != null)
					{
						PropertyDescriptorCollection itemProperties = labelItemBindingSource.CurrencyManager.GetItemProperties();
						int num = labelItemBindingSource.Find(itemProperties["SubID"], currentItemRow.SubID);
						if (num <= -1)
						{
							return;
						}
						labelItemBindingSource.Position = num;
						_dragState = DragState.Move;
						(sender as Control).Cursor = Cursors.SizeAll;
						if (!bMulti_C && !bMulti_S)
						{
							foreach (DataGridViewRow item3 in (IEnumerable)labelitemDataGridView.Rows)
							{
								if ((int)item3.Cells[0].Value == currentItemRow.SubID)
								{
									item3.Selected = true;
								}
								else
								{
									item3.Selected = false;
								}
							}
						}
						_bIsDrag = true;
						_ptStart = new Point(e.X, e.Y);
						_left = currentItemRow.Left;
						_top = currentItemRow.Top;
						_width = currentItemRow.Width;
						_height = currentItemRow.Height;
						_labelWidth = currentRow.Width;
						_labelHeight = currentRow.Height;
					}
					else
					{
						_dragState = DragState.Select;
						_bIsDrag = true;
						_ptStart = new Point(e.X, e.Y);
					}
					return;
				}
				_dragState = DragState.Move;
				(sender as Control).Cursor = Cursors.SizeAll;
				_list_ct = currentItemRow.SubID;
				_list.Clear();
				foreach (DataGridViewRow item4 in (IEnumerable)labelitemDataGridView.Rows)
				{
					if (item4.Selected)
					{
						_list.Add((int)item4.Cells[0].Value);
					}
				}
			}
		}
		_bIsDrag = true;
		subPanel.Capture = true;
		if (currentItemRow != null)
		{
			_left = currentItemRow.Left;
			_top = currentItemRow.Top;
			_width = currentItemRow.Width;
			_height = currentItemRow.Height;
		}
		_ptStart = new Point(e.X, e.Y);
	}

	private void subPanel_MouseDoubleClick(object sender, MouseEventArgs e)
	{
		flagButton.PerformClick();
	}

	private void subPanel_MouseMove_check(int Vin, char A, ref int Vout, int limit)
	{
		if (A == '+')
		{
			if (limit >= 0)
			{
				if (Vin + Vout < limit)
				{
					Vout = -Vin + limit;
				}
			}
			else if (Vin + Vout > -limit)
			{
				Vout = -Vin - limit;
			}
		}
		else if (limit >= 0)
		{
			if (Vin - Vout < limit)
			{
				Vout = Vin - limit;
			}
		}
		else if (Vin - Vout > -limit)
		{
			Vout = Vin + limit;
		}
	}

	private void subPanel_MouseMove_check(int Vin, char A, ref int Vout)
	{
		subPanel_MouseMove_check(Vin, A, ref Vout, 0);
	}

	private void multiItem_move(int diffX, int diffY, ECSDataSet.LabelRow row)
	{
		foreach (DataGridViewRow item in (IEnumerable)labelitemDataGridView.Rows)
		{
			if (!(item.DataBoundItem is DataRowView dataRowView) || (_list_ct != (int)dataRowView.Row.ItemArray[1] && !_list.Contains((int)dataRowView.Row.ItemArray[1])))
			{
				continue;
			}
			ECSDataSet.LabelItemRow labelItemRow = dataRowView.Row as ECSDataSet.LabelItemRow;
			if (labelItemRow.Flag1 == 5)
			{
				if (diffY < -labelItemRow.Top)
				{
					diffY = -labelItemRow.Top;
				}
				if (diffY > row.Height - labelItemRow.Top)
				{
					diffY = row.Height - labelItemRow.Top;
				}
			}
			else if (labelItemRow.Angle == 0)
			{
				if (diffX < -labelItemRow.Left)
				{
					diffX = -labelItemRow.Left;
				}
				if (diffX > row.Width - labelItemRow.Left - labelItemRow.Width)
				{
					diffX = row.Width - labelItemRow.Left - labelItemRow.Width;
				}
				if (diffY < -labelItemRow.Top)
				{
					diffY = -labelItemRow.Top;
				}
				if (diffY > row.Height - labelItemRow.Top - labelItemRow.Height)
				{
					diffY = row.Height - labelItemRow.Top - labelItemRow.Height;
				}
			}
			else if (labelItemRow.Angle == 1)
			{
				if (diffX < -(labelItemRow.Left - labelItemRow.Height))
				{
					diffX = -(labelItemRow.Left - labelItemRow.Height);
				}
				if (diffX > row.Width - labelItemRow.Left)
				{
					diffX = row.Width - labelItemRow.Left;
				}
				if (diffY < -labelItemRow.Top)
				{
					diffY = -labelItemRow.Top;
				}
				if (diffY > row.Height - labelItemRow.Top - labelItemRow.Width)
				{
					diffY = row.Height - labelItemRow.Top - labelItemRow.Width;
				}
			}
			else if (labelItemRow.Angle == 2)
			{
				if (diffX < -(labelItemRow.Left - labelItemRow.Width))
				{
					diffX = -(labelItemRow.Left - labelItemRow.Width);
				}
				if (diffX > row.Width - labelItemRow.Left)
				{
					diffX = row.Width - labelItemRow.Left;
				}
				if (diffY < -(labelItemRow.Top - labelItemRow.Height))
				{
					diffY = -(labelItemRow.Top - labelItemRow.Height);
				}
				if (diffY > row.Height - labelItemRow.Top)
				{
					diffY = row.Height - labelItemRow.Top;
				}
			}
			else if (labelItemRow.Angle == 3)
			{
				if (diffX < -labelItemRow.Left)
				{
					diffX = -labelItemRow.Left;
				}
				if (diffX > row.Width - labelItemRow.Left - labelItemRow.Height)
				{
					diffX = row.Width - labelItemRow.Left - labelItemRow.Height;
				}
				if (diffY < -(labelItemRow.Top - labelItemRow.Width))
				{
					diffY = -(labelItemRow.Top - labelItemRow.Width);
				}
				if (diffY > row.Height - labelItemRow.Top)
				{
					diffY = row.Height - labelItemRow.Top;
				}
			}
		}
		foreach (DataGridViewRow item2 in (IEnumerable)labelitemDataGridView.Rows)
		{
			if (item2.DataBoundItem is DataRowView dataRowView2 && (_list_ct == (int)dataRowView2.Row.ItemArray[1] || _list.Contains((int)dataRowView2.Row.ItemArray[1])))
			{
				ECSDataSet.LabelItemRow labelItemRow2 = dataRowView2.Row as ECSDataSet.LabelItemRow;
				if (labelItemRow2.Flag1 != 5)
				{
					labelItemRow2.Left += diffX;
				}
				labelItemRow2.Top += diffY;
				item2.Selected = true;
			}
		}
	}

	private void subPanel_DisplaySS(int width, int height)
	{
		pt_Mid_StatusStrip.Visible = true;
		pt_Mid_Width_TSSLabel.Text = widthLabel.Text + " " + width / 8 + " mm";
		pt_Mid_Height_TSSLabel.Text = heightLabel.Text + " " + height / 8 + " mm";
	}

	private void subPanel_HideSS()
	{
		pt_Mid_StatusStrip.Visible = false;
	}

	private void subPanel_MouseMove(object sender, MouseEventArgs e)
	{
		ECSDataSet.LabelItemRow currentItemRow = GetCurrentItemRow();
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		bool flag = false;
		if (_bIsDrag)
		{
			if (currentItemRow == null)
			{
				return;
			}
			int Vout = (_diffX = e.X - _ptStart.X);
			int Vout2 = (_diffY = e.Y - _ptStart.Y);
			int left = 0;
			int top = 0;
			int num = 0;
			int num2 = 0;
			if (currentItemRow != null)
			{
				left = currentItemRow.Left;
				top = currentItemRow.Top;
				num = currentItemRow.Width;
				num2 = currentItemRow.Height;
			}
			switch (_dragState)
			{
			case DragState.Move:
				Vout -= currentItemRow.Left - _left;
				Vout2 -= currentItemRow.Top - _top;
				if (_list.Contains(_list_ct))
				{
					_list.Remove(_list_ct);
				}
				multiItem_move(Vout, Vout2, currentRow);
				break;
			case DragState.LeftTop:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_width, '-', ref Vout, 8);
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_height, '-', ref Vout2, 8);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Width = _width - Vout;
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Height = _height - Vout2;
					break;
				case 1:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_width, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout, -_left);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Width = _width - Vout2;
					currentItemRow.Height = _height - Vout;
					break;
				case 2:
					subPanel_MouseMove_check(_width, '-', ref Vout, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_width, '-', ref Vout, -_left);
					subPanel_MouseMove_check(_height, '-', ref Vout2, -_top);
					currentItemRow.Width = _width - Vout;
					currentItemRow.Height = _height - Vout2;
					break;
				case 3:
					subPanel_MouseMove_check(_width, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_height, '-', ref Vout, 8);
					subPanel_MouseMove_check(_width, '-', ref Vout2, -_top);
					currentItemRow.Width = _width - Vout2;
					currentItemRow.Left = _left + Vout;
					currentItemRow.Height = _height - Vout;
					break;
				}
				break;
			case DragState.RightBottom:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_width, '+', ref Vout, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_width, '+', ref Vout, -_labelWidth + _left);
					subPanel_MouseMove_check(_height, '+', ref Vout2, -_labelHeight + _top);
					currentItemRow.Width = _width + Vout;
					currentItemRow.Height = _height + Vout2;
					break;
				case 1:
					subPanel_MouseMove_check(_width, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_height, '+', ref Vout, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout, -_labelWidth);
					subPanel_MouseMove_check(_width, '+', ref Vout2, -_labelHeight + _top);
					currentItemRow.Width = _width + Vout2;
					currentItemRow.Left = _left + Vout;
					currentItemRow.Height = _height + Vout;
					break;
				case 2:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_width, '+', ref Vout, 8);
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_height, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout, -_labelWidth);
					subPanel_MouseMove_check(_top, '+', ref Vout2, -_labelHeight);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Width = _width + Vout;
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Height = _height + Vout2;
					break;
				case 3:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_width, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout, -_labelWidth + _left);
					subPanel_MouseMove_check(_top, '+', ref Vout2, -_labelHeight);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Width = _width + Vout2;
					currentItemRow.Height = _height + Vout;
					break;
				}
				break;
			case DragState.LeftBottom:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_width, '-', ref Vout, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout2, -_labelHeight + _top);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Width = _width - Vout;
					currentItemRow.Height = _height + Vout2;
					break;
				case 1:
					subPanel_MouseMove_check(_width, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout, -_left);
					subPanel_MouseMove_check(_width, '+', ref Vout2, -_labelHeight + _top);
					currentItemRow.Width = _width + Vout2;
					currentItemRow.Height = _height - Vout;
					break;
				case 2:
					subPanel_MouseMove_check(_width, '-', ref Vout, 8);
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_height, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_width, '-', ref Vout, -_left);
					subPanel_MouseMove_check(_top, '+', ref Vout2, -_labelHeight);
					currentItemRow.Width = _width - Vout;
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Height = _height + Vout2;
					break;
				case 3:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_width, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_height, '-', ref Vout, 8);
					subPanel_MouseMove_check(_top, '+', ref Vout2, -_labelHeight);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Width = _width + Vout2;
					currentItemRow.Left = _left + Vout;
					currentItemRow.Height = _height - Vout;
					break;
				}
				break;
			case DragState.RightTop:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_width, '+', ref Vout, 8);
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_height, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_width, '+', ref Vout, -_labelWidth + _left);
					currentItemRow.Width = _width + Vout;
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Height = _height - Vout2;
					break;
				case 1:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_width, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_height, '+', ref Vout, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout, -_labelWidth);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Width = _width - Vout2;
					currentItemRow.Left = _left + Vout;
					currentItemRow.Height = _height + Vout;
					break;
				case 2:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_width, '+', ref Vout, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout, -_labelWidth);
					subPanel_MouseMove_check(_height, '-', ref Vout2, -_top);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Width = _width + Vout;
					currentItemRow.Height = _height - Vout2;
					break;
				case 3:
					subPanel_MouseMove_check(_width, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout, -_labelWidth + _left);
					subPanel_MouseMove_check(_width, '-', ref Vout2, -_top);
					currentItemRow.Width = _width - Vout2;
					currentItemRow.Height = _height + Vout;
					break;
				}
				break;
			case DragState.Left:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_width, '-', ref Vout, 8);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Width = _width - Vout;
					break;
				case 1:
					subPanel_MouseMove_check(_height, '-', ref Vout, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout, -_left);
					currentItemRow.Height = _height - Vout;
					break;
				case 2:
					subPanel_MouseMove_check(_width, '-', ref Vout, 8);
					subPanel_MouseMove_check(_width, '-', ref Vout, -_left);
					currentItemRow.Width = _width - Vout;
					break;
				case 3:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_height, '-', ref Vout, 8);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Height = _height - Vout;
					break;
				}
				break;
			case DragState.Right:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_width, '+', ref Vout, 8);
					subPanel_MouseMove_check(_width, '+', ref Vout, -_labelWidth + _left);
					currentItemRow.Width = _width + Vout;
					break;
				case 1:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_height, '+', ref Vout, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout, -_labelWidth);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Height = _height + Vout;
					break;
				case 2:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_width, '+', ref Vout, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout, -_labelWidth);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Width = _width + Vout;
					break;
				case 3:
					subPanel_MouseMove_check(_height, '+', ref Vout, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout, -_labelWidth + _left);
					currentItemRow.Height = _height + Vout;
					break;
				}
				break;
			case DragState.Top:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_height, '-', ref Vout2, 8);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Height = _height - Vout2;
					break;
				case 1:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_width, '-', ref Vout2, 8);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Width = _width - Vout2;
					break;
				case 2:
					subPanel_MouseMove_check(_height, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout2, -_top);
					currentItemRow.Height = _height - Vout2;
					break;
				case 3:
					subPanel_MouseMove_check(_width, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_width, '-', ref Vout2, -_top);
					currentItemRow.Width = _width - Vout2;
					break;
				}
				break;
			case DragState.Bottom:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_height, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout2, -_labelHeight + _top);
					currentItemRow.Height = _height + Vout2;
					break;
				case 1:
					subPanel_MouseMove_check(_width, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_width, '+', ref Vout2, -_labelHeight + _top);
					currentItemRow.Width = _width + Vout2;
					break;
				case 2:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_height, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_top, '+', ref Vout2, -_labelHeight);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Height = _height + Vout2;
					break;
				case 3:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_width, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_top, '+', ref Vout2, -_labelHeight);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Width = _width + Vout2;
					break;
				}
				break;
			case DragState.LabelBottom:
				currentRow.Height = (_labelHeight + Vout2 + 7) / 8 * 8;
				flag = true;
				break;
			case DragState.LabelRight:
				currentRow.Width = (_labelWidth + Vout + 7) / 8 * 8;
				flag = true;
				break;
			case DragState.LabelRightBottom:
				currentRow.Height = (_labelHeight + Vout2 + 7) / 8 * 8;
				currentRow.Width = (_labelWidth + Vout + 7) / 8 * 8;
				flag = true;
				break;
			}
			if (currentItemRow != null)
			{
				if (currentItemRow.Flag1 == 5)
				{
					currentItemRow.Left = left;
					currentItemRow.Width = num;
					currentItemRow.Height = num2;
					if (currentItemRow.Top < 0 || currentItemRow.Top > currentRow.Height)
					{
						currentItemRow.Top = top;
					}
				}
				else
				{
					Rectangle realRect = GetRealRect(new Rectangle(currentItemRow.Left, currentItemRow.Top, currentItemRow.Width, currentItemRow.Height), currentItemRow.Angle);
					if (realRect.Left < 0 || realRect.Left + realRect.Width > currentRow.Width || realRect.Top < 0 || realRect.Top + realRect.Height > currentRow.Height || realRect.Width < 1 || realRect.Height < 1)
					{
						currentItemRow.Left = left;
						currentItemRow.Top = top;
						currentItemRow.Width = num;
						currentItemRow.Height = num2;
					}
				}
			}
			int val = 0;
			int val2 = 0;
			ECSDataSet.LabelItemRow[] labelItemRows = currentRow.GetLabelItemRows();
			foreach (ECSDataSet.LabelItemRow labelItemRow in labelItemRows)
			{
				if (labelItemRow.Flag1 == 5)
				{
					val2 = Math.Max(val2, labelItemRow.Top);
					continue;
				}
				Rectangle realRect2 = GetRealRect(new Rectangle(labelItemRow.Left, labelItemRow.Top, labelItemRow.Width, labelItemRow.Height), labelItemRow.Angle);
				val2 = Math.Max(val2, realRect2.Bottom);
				val = Math.Max(val, realRect2.Right);
			}
			currentRow.Width = Math.Max(Settings.Default.minLabelWidth, currentRow.Width);
			currentRow.Width = Math.Max(val, currentRow.Width);
			currentRow.Width = Math.Min(Settings.Default.maxLabelWidth, currentRow.Width);
			currentRow.Height = Math.Max(Settings.Default.minLabelHeight, currentRow.Height);
			currentRow.Height = Math.Max(val2, currentRow.Height);
			currentRow.Height = Math.Min(Settings.Default.maxLabelHeight, currentRow.Height);
			subPanel.Refresh();
		}
		else if (currentItemRow != null)
		{
			if (rcLeftTop.Contains(e.X, e.Y) || rcRightBottom.Contains(e.X, e.Y) || rcLabelRightBottom.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeNWSE;
			}
			else if (rcLeftBottom.Contains(e.X, e.Y) || rcRightTop.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeNESW;
			}
			else if (rcLeft.Contains(e.X, e.Y) || rcRight.Contains(e.X, e.Y) || rcLabelRight.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeWE;
			}
			else if (rcTop.Contains(e.X, e.Y) || rcBottom.Contains(e.X, e.Y) || rcLabelBottom.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeNS;
			}
			else if (rcCur.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeAll;
			}
			else
			{
				(sender as Control).Cursor = Cursors.Arrow;
			}
		}
		else if (currentRow != null)
		{
			if (rcLabelRightBottom.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeNWSE;
			}
			else if (rcLabelRight.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeWE;
			}
			else if (rcLabelBottom.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeNS;
			}
			else
			{
				(sender as Control).Cursor = Cursors.Arrow;
			}
		}
		else
		{
			(sender as Control).Cursor = Cursors.Arrow;
		}
		if (!flag)
		{
			subPanel_HideSS();
			return;
		}
		subPanel_DisplaySS(currentRow.Width, currentRow.Height);
		pt_Mid_StatusStrip.Refresh();
	}

	private void subPanel_MouseUp(object sender, MouseEventArgs e)
	{
		if (_dragState == DragState.Select)
		{
			if (!bMulti_C && !bMulti_S)
			{
				bool flag = false;
				Rectangle rectangle = RT_all(_ptStart.X, _ptStart.Y, _diffX, _diffY);
				foreach (DataGridViewRow item in (IEnumerable)labelitemDataGridView.Rows)
				{
					if (!(item.DataBoundItem is DataRowView dataRowView))
					{
						continue;
					}
					ECSDataSet.LabelItemRow labelItemRow = dataRowView.Row as ECSDataSet.LabelItemRow;
					Rectangle rect;
					if (labelItemRow.Flag1 == 5)
					{
						rect = new Rectangle(0, labelItemRow.Top - 1, labelItemRow.Width, 2);
					}
					else
					{
						int w;
						int h;
						if (labelItemRow.Angle == 0)
						{
							w = labelItemRow.Width;
							h = labelItemRow.Height;
						}
						else if (labelItemRow.Angle == 1)
						{
							w = -labelItemRow.Height;
							h = labelItemRow.Width;
						}
						else if (labelItemRow.Angle == 2)
						{
							w = -labelItemRow.Width;
							h = -labelItemRow.Height;
						}
						else
						{
							w = labelItemRow.Height;
							h = -labelItemRow.Width;
						}
						rect = RT_all(labelItemRow.Left, labelItemRow.Top, w, h);
					}
					if (rectangle.IntersectsWith(rect))
					{
						item.Selected = true;
						if (!flag)
						{
							flag = true;
							PropertyDescriptorCollection itemProperties = labelItemBindingSource.CurrencyManager.GetItemProperties();
							int num = labelItemBindingSource.Find(itemProperties["SubID"], ((DataRowView)item.DataBoundItem).Row.ItemArray[1]);
							if (num > -1)
							{
								labelItemBindingSource.Position = num;
							}
						}
					}
					else
					{
						item.Selected = false;
					}
				}
				if (!flag)
				{
					int subID = GetCurrentItemRow().SubID;
					foreach (DataGridViewRow item2 in (IEnumerable)labelitemDataGridView.Rows)
					{
						if ((int)item2.Cells[0].Value == subID)
						{
							item2.Selected = true;
						}
						else
						{
							item2.Selected = false;
						}
					}
				}
			}
		}
		else if (bMulti_C || bMulti_S)
		{
			if (_list.Count != 0)
			{
				if (_list.Count == 1)
				{
					if (!_list.Contains(_list_ct))
					{
						foreach (DataGridViewRow item3 in (IEnumerable)labelitemDataGridView.Rows)
						{
							if (item3.DataBoundItem is DataRowView dataRowView2)
							{
								_ = dataRowView2.Row;
								if (_list_ct == (int)dataRowView2.Row.ItemArray[1] || _list.Contains((int)dataRowView2.Row.ItemArray[1]))
								{
									item3.Selected = true;
								}
								else
								{
									item3.Selected = false;
								}
							}
						}
					}
				}
				else if (_list.Contains(_list_ct))
				{
					PropertyDescriptorCollection itemProperties2 = labelItemBindingSource.CurrencyManager.GetItemProperties();
					int num2 = ((_list[0] != _list_ct) ? labelItemBindingSource.Find(itemProperties2["SubID"], _list[0]) : labelItemBindingSource.Find(itemProperties2["SubID"], _list[1]));
					if (num2 > -1)
					{
						labelItemBindingSource.Position = num2;
					}
					foreach (DataGridViewRow item4 in (IEnumerable)labelitemDataGridView.Rows)
					{
						if (item4.DataBoundItem is DataRowView dataRowView3)
						{
							_ = dataRowView3.Row;
							if (_list_ct != (int)dataRowView3.Row.ItemArray[1] && _list.Contains((int)dataRowView3.Row.ItemArray[1]))
							{
								item4.Selected = true;
							}
							else
							{
								item4.Selected = false;
							}
						}
					}
				}
				else
				{
					foreach (DataGridViewRow item5 in (IEnumerable)labelitemDataGridView.Rows)
					{
						if (item5.DataBoundItem is DataRowView dataRowView4)
						{
							_ = dataRowView4.Row;
							if (_list_ct == (int)dataRowView4.Row.ItemArray[1] || _list.Contains((int)dataRowView4.Row.ItemArray[1]))
							{
								item5.Selected = true;
							}
							else
							{
								item5.Selected = false;
							}
						}
					}
				}
			}
		}
		else
		{
			foreach (DataGridViewRow item6 in (IEnumerable)labelitemDataGridView.Rows)
			{
				if (item6.DataBoundItem is DataRowView dataRowView5)
				{
					_ = dataRowView5.Row;
					if (_list_ct == (int)dataRowView5.Row.ItemArray[1] || _list.Contains((int)dataRowView5.Row.ItemArray[1]))
					{
						item6.Selected = true;
					}
					else
					{
						item6.Selected = false;
					}
				}
			}
		}
		_list.Clear();
		_list_ct = -1;
		subPanel.Capture = false;
		_bIsDrag = false;
		_diffX = (_diffY = 0);
		subPanel.Invalidate();
	}

	private void CheckInfo()
	{
		tp_Info_TableLayoutPanel.SuspendLayout();
		foreach (Panel item in pt_Info_Panel)
		{
			item.Visible = false;
		}
		pt_Picture_Panel.Visible = false;
		pt_Picture_ComboBox.Items.Clear();
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (currentRow != null)
		{
			ECSDataSet.LabelItemRow[] labelItemRows = currentRow.GetLabelItemRows();
			foreach (ECSDataSet.LabelItemRow labelItemRow in labelItemRows)
			{
				if (labelItemRow.Flag1 == 3)
				{
					if (labelItemRow.Flag2 < 32)
					{
						pt_Info_Panel[labelItemRow.Flag2 + 28].Visible = true;
					}
				}
				else if (labelItemRow.Flag1 == 6)
				{
					pt_Picture_ComboBox.Items.Add(labelItemRow.Flag2);
				}
				else if (labelItemRow.Flag1 == 2)
				{
					if (labelItemRow.Flag2 == 0)
					{
						pt_Info_Panel[0].Visible = true;
					}
					else if (labelItemRow.Flag2 == 1)
					{
						pt_Info_Panel[1].Visible = true;
					}
					else if (labelItemRow.Flag2 >= 17 && labelItemRow.Flag2 <= 24)
					{
						pt_Info_Panel[labelItemRow.Flag2 - 17 + 4].Visible = true;
					}
					else if (labelItemRow.Flag2 >= 36 && labelItemRow.Flag2 <= 43)
					{
						pt_Info_Panel[labelItemRow.Flag2 - 36 + 12].Visible = true;
					}
				}
			}
		}
		if (pt_Picture_ComboBox.Items.Count > 0)
		{
			pt_Picture_Panel.Visible = true;
			pt_Picture_ComboBox.SelectedIndex = 0;
			if (pt_Picture_ComboBox.Items.Count == 1)
			{
				pt_Picture_ComboBox.Enabled = false;
			}
		}
		tp_Info_TableLayoutPanel.ResumeLayout(performLayout: false);
		tp_Info_TableLayoutPanel.PerformLayout();
	}

	private void labelBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
	{
		labelItemBindingSource_BindingComplete(sender, e);
	}

	private void labelnext()
	{
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (wcStep == WizardConfigStep.PT_1 || wcStep == WizardConfigStep.PT_2 || wcStep == WizardConfigStep.PT_3)
		{
			if (currentRow.LabelID >= Settings.Default.minUserLabelID && currentRow.LabelID <= Settings.Default.maxUserLabelID)
			{
				PT_EditClone_Button.Text = Program.GetLang("pw_Edit");
				Next_button.Text = Program.GetLang("pw_Next");
			}
			else
			{
				PT_EditClone_Button.Text = string.Format(Program.GetLang("pw_EditCloneTo"), no_PTCloneTo);
				Next_button.Text = string.Format(Program.GetLang("pw_NextCloneTo"), no_PTCloneTo);
			}
			if ((currentRow.LabelID >= Settings.Default.minUserLabelID && currentRow.LabelID <= Settings.Default.maxLabelID) || (currentRow.LabelID >= Settings.Default.minLabelID_Recycled && currentRow.LabelID <= Settings.Default.maxLabelID_Recycled))
			{
				bindingNavigatorDeleteItem.Enabled = true;
			}
			else
			{
				bindingNavigatorDeleteItem.Enabled = false;
			}
		}
	}

	private void labelBindingSource_CurrentChanged(object sender, EventArgs e)
	{
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (wcStep == WizardConfigStep.PT_1)
		{
			ctSC.PT_ItemLabel = currentRow.LabelID;
		}
		else if (wcStep == WizardConfigStep.PT_2)
		{
			ctSC.PT_SumLabel = currentRow.LabelID;
		}
		else if (wcStep == WizardConfigStep.PT_3)
		{
			ctSC.PT_Receipt = currentRow.LabelID;
		}
		if (currentRow != null && currentRow.LabelID != lastID)
		{
			lastID = currentRow.LabelID;
			CheckInfo();
		}
		labelnext();
		PT_Edit_Check();
	}

	private void labelBindingSource_PositionChanged()
	{
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (currentRow == null)
		{
			subPanel.Width = 360;
			subPanel.Height = 270;
			return;
		}
		subPanel.Width = currentRow.Width;
		subPanel.Height = currentRow.Height;
		if (!currentRow.IsVersionNull())
		{
			if (currentRow.Version == 0)
			{
				labelItemFontBindingSource.DataMember = "LabelItem_Font1";
			}
			else if (currentRow.Version == 1)
			{
				labelItemFontBindingSource.DataMember = "LabelItem_Font2";
			}
		}
		foreach (DataGridViewRow item in (IEnumerable)labelitemDataGridView.Rows)
		{
			if (item.Selected)
			{
				item.Selected = false;
			}
		}
	}

	private void labelBindingSource_PositionChanged(object sender, EventArgs e)
	{
		labelBindingSource_PositionChanged();
	}

	private void labelItemBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
	{
		if (e.BindingCompleteContext == BindingCompleteContext.DataSourceUpdate)
		{
			BindingSource bindingSource = sender as BindingSource;
			try
			{
				bindingSource.EndEdit();
			}
			catch
			{
				bindingSource.CancelEdit();
			}
		}
		subPanel.Invalidate();
	}

	private void labelItemBindingSource_DataSourceChanged(object sender, EventArgs e)
	{
		foreach (DataGridViewRow item in (IEnumerable)labelitemDataGridView.Rows)
		{
			item.Selected = false;
		}
	}

	private void UpdateFlag()
	{
		ECSDataSet.LabelItemRow currentItemRow = GetCurrentItemRow();
		if (currentItemRow != null)
		{
			int flag = currentItemRow.Flag1;
			Label label = fontLabel;
			bool visible = (fontComboBox.Visible = flag != 0 && flag != 4 && flag != 5 && flag != 6);
			label.Visible = visible;
			Label label2 = alignLabel;
			ComboBox comboBox = alignComboBox;
			bool flag3 = (alignButton.Visible = flag != 4 && flag != 5);
			bool visible2 = (comboBox.Visible = flag3);
			label2.Visible = visible2;
			currentItemRow.Display = GetDisplay(currentItemRow);
		}
	}

	private void UpdateFlagAll()
	{
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		ECSDataSet.LabelItemRow[] labelItemRows = currentRow.GetLabelItemRows();
		foreach (ECSDataSet.LabelItemRow labelItemRow in labelItemRows)
		{
			if (labelItemRow != null)
			{
				int flag = labelItemRow.Flag1;
				Label label = fontLabel;
				bool visible = (fontComboBox.Visible = flag != 0 && flag != 4 && flag != 5 && flag != 6);
				label.Visible = visible;
				Label label2 = alignLabel;
				ComboBox comboBox = alignComboBox;
				bool flag3 = (alignButton.Visible = flag != 4 && flag != 5);
				bool visible2 = (comboBox.Visible = flag3);
				label2.Visible = visible2;
				labelItemRow.Display = GetDisplay(labelItemRow);
			}
		}
	}

	private void labelItemBindingSource_PositionChanged(object sender, EventArgs e)
	{
		UpdateFlag();
	}

	private void alignButton_Click(object sender, EventArgs e)
	{
		using AlignForm alignForm = new AlignForm();
		if (alignForm.ShowDialog(this) == DialogResult.OK)
		{
			alignComboBox.SelectedIndex = alignForm.Align;
		}
	}

	private void flagButton_Click(object sender, EventArgs e)
	{
		ECSDataSet.LabelItemRow currentItemRow = GetCurrentItemRow();
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (currentItemRow == null || currentRow == null)
		{
			return;
		}
		using FlagForm flagForm = new FlagForm();
		flagForm.Flag1 = currentItemRow.Flag1;
		flagForm.Flag2 = currentItemRow.Flag2;
		flagForm.Flag3 = currentItemRow.Flag3;
		for (int i = 0; i < 32; i++)
		{
			try
			{
				flagForm.text[i] = (string)currentRow["Text" + (i + 1)];
			}
			catch
			{
				flagForm.text[i] = "";
			}
		}
		if (flagForm.ShowDialog(this) == DialogResult.OK)
		{
			currentItemRow.Flag1 = flagForm.Flag1;
			currentItemRow.Flag2 = flagForm.Flag2;
			currentItemRow.Flag3 = flagForm.Flag3;
			for (int j = 0; j < 32; j++)
			{
				currentRow["Text" + (j + 1)] = flagForm.text[j];
			}
			UpdateFlag();
			CheckInfo();
		}
	}

	private void PT_Edit_Check()
	{
		if (pt_Editing)
		{
			pt_LeftUD_SplitContainer.Panel1Collapsed = true;
			tp_Info_TableLayoutPanel.Enabled = true;
			PT_Back_Button.Enabled = true;
			PT_EditClone_Button.Enabled = false;
			blink_remove(PT_EditClone_Button);
		}
		else
		{
			pt_LeftUD_SplitContainer.Panel2Collapsed = true;
			tp_Info_TableLayoutPanel.Enabled = false;
			PT_Back_Button.Enabled = false;
			PT_EditClone_Button.Enabled = true;
			blink_add(PT_EditClone_Button);
		}
		subPanel.Enabled = pt_Editing;
	}

	private void NumericUpDown_ValueChanged_Div8(NumericUpDown V0, NumericUpDown V1)
	{
		int num = (int)(V1.Value + 7m) / 8;
		if ((decimal)(num * 8) != V1.Value)
		{
			V1.Value = num * 8;
		}
		V0.Value = num;
	}

	private void NumericUpDown_ValueChanged_Multi8(NumericUpDown V0, NumericUpDown V1)
	{
		int num = (int)Math.Ceiling(V1.Value);
		if ((decimal)num != V1.Value)
		{
			V1.Value = num;
		}
		V0.Value = num * 8;
	}

	private void PPheightNumericUpDown_ValueChanged(object sender, EventArgs e)
	{
		if (sender == PPwidthNumericUpDown)
		{
			NumericUpDown_ValueChanged_Div8(PPwidthMMNumericUpDown, PPwidthNumericUpDown);
		}
		else if (sender == PPwidthMMNumericUpDown)
		{
			NumericUpDown_ValueChanged_Multi8(PPwidthNumericUpDown, PPwidthMMNumericUpDown);
		}
		else if (sender == PPheightNumericUpDown)
		{
			NumericUpDown_ValueChanged_Div8(PPheightMMNumericUpDown, PPheightNumericUpDown);
		}
		else if (sender == PPheightMMNumericUpDown)
		{
			NumericUpDown_ValueChanged_Multi8(PPheightNumericUpDown, PPheightMMNumericUpDown);
		}
	}

	private void pt_Picture_ComboBox_SelectedValueChanged(object sender, EventArgs e)
	{
		if (pt_Picture_ComboBox.SelectedItem == null)
		{
			pt_Picture_PictureBox.Image = null;
			return;
		}
		int num = (int)pt_Picture_ComboBox.SelectedItem;
		foreach (SinglePicture item in pt_LSP)
		{
			if (item.ID == num)
			{
				pt_Picture_PictureBox.Image = item.Picture;
				return;
			}
		}
		pt_Picture_PictureBox.Image = null;
	}

	private void pt_Picture_ClearButton_Click(object sender, EventArgs e)
	{
		pt_Picture_PictureBox.Image = null;
		if (pt_Picture_ComboBox.SelectedItem != null)
		{
			int ctID = (int)pt_Picture_ComboBox.SelectedItem;
			if (BitmapFuc.DataSet_Bitmap_Remove(ref pt_LSP, ctID))
			{
				BitmapFuc.DataSet_Bitmap_Save(ref pt_LSP);
			}
		}
	}

	private void pt_Picture_SelectButton_Click(object sender, EventArgs e)
	{
		if (pt_Picture_ComboBox.SelectedItem == null)
		{
			return;
		}
		int num = (int)pt_Picture_ComboBox.SelectedItem;
		int num3;
		int num2 = (num3 = 0);
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		ECSDataSet.LabelItemRow[] labelItemRows = currentRow.GetLabelItemRows();
		foreach (ECSDataSet.LabelItemRow labelItemRow in labelItemRows)
		{
			if (labelItemRow.Flag1 == 6 && labelItemRow.Flag2 == num)
			{
				if (labelItemRow.Angle == 0 || labelItemRow.Angle == 2)
				{
					num2 = labelItemRow.Width;
					num3 = 1024;
				}
				else
				{
					num2 = 1024;
					num3 = labelItemRow.Height;
				}
				break;
			}
		}
		if (num2 == 0 || num3 == 0)
		{
			return;
		}
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.CheckFileExists = true;
		openFileDialog.Filter = Program.GetLang("pw_JPEGFile___jpg____jpg_AllFile_________");
		if (openFileDialog.ShowDialog(this) != DialogResult.OK)
		{
			return;
		}
		using WizardPicForm wizardPicForm = new WizardPicForm(openFileDialog.FileName, num2, num3);
		if (wizardPicForm.ShowDialog(this) == DialogResult.OK)
		{
			BitmapFuc.DataSet_Bitmap_Overwrite(ref pt_LSP, num, wizardPicForm.SG_Name, wizardPicForm.SG_Image, wizardPicForm.SG_String);
			BitmapFuc.DataSet_Bitmap_Save(ref pt_LSP);
		}
	}

	private bool PT_Clone()
	{
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (currentRow == null)
		{
			return false;
		}
		if (currentRow.LabelID >= Settings.Default.minUserLabelID && currentRow.LabelID <= Settings.Default.maxUserLabelID)
		{
			return false;
		}
		if (no_PTCloneTo <= 0)
		{
			return false;
		}
		bool result = false;
		ECSDataSet.LabelRow labelRow = eCSDataSet.Label.FindByLabelID(no_PTCloneTo);
		if (labelRow != null && (labelRow.RowState != DataRowState.Deleted || labelRow.RowState != DataRowState.Detached))
		{
			int num = Settings.Default.minLabelID_Recycled;
			while (true)
			{
				ECSDataSet.LabelRow labelRow2 = eCSDataSet.Label.FindByLabelID(num);
				if (labelRow2 == null || (labelRow2.RowState == DataRowState.Deleted && labelRow2.RowState == DataRowState.Detached))
				{
					break;
				}
				if (num == Settings.Default.maxLabelID_Recycled)
				{
					eCSDataSet.Label.RemoveLabelRow(labelRow2);
					break;
				}
				num++;
			}
			labelRow.Name = Program.GetLang("pw_Recycled") + ": " + labelRow.Name;
			labelRow.LabelID = num;
			num++;
			if (num > Settings.Default.maxLabelID_Recycled)
			{
				num = Settings.Default.minLabelID_Recycled;
			}
			labelRow = eCSDataSet.Label.FindByLabelID(num);
			if (labelRow != null)
			{
				eCSDataSet.Label.RemoveLabelRow(labelRow);
			}
		}
		try
		{
			labelDataGridView.EndEdit();
			labelBindingSource.EndEdit();
			object[] itemArray = currentRow.ItemArray;
			itemArray[0] = no_PTCloneTo;
			itemArray[4] = Program.GetLang("pw_Clone") + ": " + (string)itemArray[4];
			eCSDataSet.Label.Rows.Add(itemArray);
			int num2 = labelBindingSource.Find("LabelID", no_PTCloneTo);
			if (num2 != -1)
			{
				labelBindingSource.Position = num2;
			}
			if (num2 != -1)
			{
				labelBindingSource.Position = num2;
			}
			if (num2 != -1)
			{
				labelBindingSource.Position = num2;
			}
			ECSDataSet.LabelItemRow[] labelItemRows = currentRow.GetLabelItemRows();
			foreach (ECSDataSet.LabelItemRow labelItemRow in labelItemRows)
			{
				object[] itemArray2 = labelItemRow.ItemArray;
				itemArray2[0] = no_PTCloneTo;
				eCSDataSet.LabelItem.Rows.Add(itemArray2);
			}
			CheckInfo();
			result = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			labelBindingSource.CancelEdit();
		}
		return result;
	}

	private void PT_Back_Button_Click(object sender, EventArgs e)
	{
		if (pt_Editing)
		{
			pt_Editing = !pt_Editing;
			PT_Edit_Check();
		}
	}

	private void PT_EditClone_Button_Click(object sender, EventArgs e)
	{
		if (!pt_Editing)
		{
			PT_Clone();
			pt_Editing = !pt_Editing;
			PT_Edit_Check();
		}
	}

	private void printFormatItem_DataGridView_KeyDown(object sender, KeyEventArgs e)
	{
		if ((e.KeyCode & Keys.ShiftKey) == Keys.ShiftKey)
		{
			bMulti_S = true;
		}
		if ((e.KeyCode & Keys.ControlKey) == Keys.ControlKey)
		{
			bMulti_C = true;
		}
		if (e.KeyCode != Keys.Left && e.KeyCode != Keys.Right && e.KeyCode != Keys.Up && e.KeyCode != Keys.Down)
		{
			return;
		}
		ECSDataSet.LabelItemRow currentItemRow = GetCurrentItemRow();
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		_list_ct = currentItemRow.SubID;
		_list.Clear();
		foreach (DataGridViewRow item in (IEnumerable)labelitemDataGridView.Rows)
		{
			if (item.Selected)
			{
				_list.Add((int)item.Cells[0].Value);
			}
		}
		if (e.KeyCode == Keys.Left)
		{
			multiItem_move(-1, 0, currentRow);
		}
		else if (e.KeyCode == Keys.Right)
		{
			multiItem_move(1, 0, currentRow);
		}
		else if (e.KeyCode == Keys.Up)
		{
			multiItem_move(0, -1, currentRow);
		}
		else if (e.KeyCode == Keys.Down)
		{
			multiItem_move(0, 1, currentRow);
		}
		e.Handled = true;
	}

	private void printFormatItem_DataGridView_KeyUp(object sender, KeyEventArgs e)
	{
		if ((e.KeyCode & Keys.ShiftKey) == Keys.ShiftKey)
		{
			bMulti_S = false;
		}
		if ((e.KeyCode & Keys.ControlKey) == Keys.ControlKey)
		{
			bMulti_C = false;
		}
	}

	private int GetAvailableLabelID()
	{
		int minUserLabelID = Settings.Default.minUserLabelID;
		for (int i = minUserLabelID; i <= Settings.Default.maxLabelID; i++)
		{
			ECSDataSet.LabelRow labelRow = eCSDataSet.Label.FindByLabelID(i);
			if (labelRow == null || (labelRow.RowState == DataRowState.Deleted && labelRow.RowState == DataRowState.Detached))
			{
				return i;
			}
		}
		return -1;
	}

	private void bindingNavigatorAddNewItem_Click(object sender, EventArgs e)
	{
		Validate();
		try
		{
			labelDataGridView.EndEdit();
			labelBindingSource.EndEdit();
			int availableLabelID = GetAvailableLabelID();
			if (availableLabelID != -1)
			{
				ECSDataSet.LabelRow labelRow = eCSDataSet.Label.NewLabelRow();
				labelRow.LabelID = availableLabelID;
				eCSDataSet.Label.AddLabelRow(labelRow);
				int num = labelBindingSource.Find("LabelID", availableLabelID);
				if (num != -1)
				{
					labelBindingSource.Position = num;
				}
			}
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			labelBindingSource.CancelEdit();
		}
	}

	private void bindingNavigatorDeleteItem_Click(object sender, EventArgs e)
	{
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (currentRow == null || (Program.right == Program.Right.User && currentRow.LabelID < Settings.Default.minUserLabelID))
		{
			return;
		}
		string arg = currentRow.LabelID.ToString();
		if (MessageBox.Show(this, string.Format(Program.GetLang("pw_Delete_0__"), arg), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) == DialogResult.Yes)
		{
			labelDataGridView.Rows.Remove(labelDataGridView.CurrentRow);
			try
			{
				labelTableAdapter.Update(eCSDataSet.Label);
				labelItemTableAdapter.Update(eCSDataSet.LabelItem);
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void P1_TypeX_radioButton_CheckedChanged(object sender, EventArgs e)
	{
		P1_Part4_groupBox.Visible = P1_Type15651_radioButton.Checked || P1_Type16551_radioButton.Checked || P1_Type24651_radioButton.Checked || P1_Type25551_radioButton.Checked || P1_Type26451_radioButton.Checked;
		P1_Part6_xxxxDecimal_NumericUpDown_Visible();
		if (P1_Type15651_radioButton.Checked || P1_Type1561_radioButton.Checked)
		{
			if (P1_P1_ItemFlag_numericUpDown.Value > 9m)
			{
				P1_P1_ItemFlag_numericUpDown.Value = 2m;
			}
			P1_P1_ItemFlag_numericUpDown.Maximum = 9m;
			if (P1_P1_2SumFlag_numericUpDown.Value > 999999m)
			{
				P1_P1_2SumFlag_numericUpDown.Value = 299999m;
			}
			P1_P1_2SumFlag_numericUpDown.Maximum = 999999m;
			if (P1_P1_2SumFlag_numericUpDown.Value <= 99999m)
			{
				P1_P1_2SumFlag_numericUpDown.Value = 299999m;
			}
			if (P1_P2Const_numericUpDown.Value > 99999m)
			{
				P1_P2Const_numericUpDown.Value = 99999m;
			}
			P1_P2Const_numericUpDown.Maximum = 99999m;
			if (P1_P2Const_numericUpDown.Value <= 9999m)
			{
				P1_P2Const_numericUpDown.Value = 99999m;
			}
		}
		else if (P1_Type16551_radioButton.Checked || P1_Type1651_radioButton.Checked)
		{
			if (P1_P1_ItemFlag_numericUpDown.Value > 9m)
			{
				P1_P1_ItemFlag_numericUpDown.Value = 2m;
			}
			P1_P1_ItemFlag_numericUpDown.Maximum = 9m;
			if (P1_P1_2SumFlag_numericUpDown.Value > 9999999m)
			{
				P1_P1_2SumFlag_numericUpDown.Value = 2999999m;
			}
			P1_P1_2SumFlag_numericUpDown.Maximum = 9999999m;
			if (P1_P1_2SumFlag_numericUpDown.Value <= 999999m)
			{
				P1_P1_2SumFlag_numericUpDown.Value = 2999999m;
			}
			if (P1_P2Const_numericUpDown.Value > 999999m)
			{
				P1_P2Const_numericUpDown.Value = 999999m;
			}
			P1_P2Const_numericUpDown.Maximum = 999999m;
			if (P1_P2Const_numericUpDown.Value <= 99999m)
			{
				P1_P2Const_numericUpDown.Value = 999999m;
			}
		}
		else if (P1_Type2461_radioButton.Checked || P1_Type24651_radioButton.Checked)
		{
			P1_P1_ItemFlag_numericUpDown.Maximum = 99m;
			if (P1_P1_ItemFlag_numericUpDown.Value <= 9m)
			{
				P1_P1_ItemFlag_numericUpDown.Value = 20m;
			}
			if (P1_P1_2SumFlag_numericUpDown.Value > 999999m)
			{
				P1_P1_2SumFlag_numericUpDown.Value = 209999m;
			}
			P1_P1_2SumFlag_numericUpDown.Maximum = 999999m;
			if (P1_P1_2SumFlag_numericUpDown.Value <= 99999m)
			{
				P1_P1_2SumFlag_numericUpDown.Value = 209999m;
			}
			if (P1_P2Const_numericUpDown.Value > 9999m)
			{
				P1_P2Const_numericUpDown.Value = 9999m;
			}
			P1_P2Const_numericUpDown.Maximum = 9999m;
			if (P1_P2Const_numericUpDown.Value <= 999m)
			{
				P1_P2Const_numericUpDown.Value = 9999m;
			}
		}
		else if (P1_Type2551_radioButton.Checked || P1_Type25551_radioButton.Checked)
		{
			P1_P1_ItemFlag_numericUpDown.Maximum = 99m;
			if (P1_P1_ItemFlag_numericUpDown.Value <= 9m)
			{
				P1_P1_ItemFlag_numericUpDown.Value = 20m;
			}
			if (P1_P1_2SumFlag_numericUpDown.Value > 9999999m)
			{
				P1_P1_2SumFlag_numericUpDown.Value = 2099999m;
			}
			P1_P1_2SumFlag_numericUpDown.Maximum = 9999999m;
			if (P1_P1_2SumFlag_numericUpDown.Value <= 999999m)
			{
				P1_P1_2SumFlag_numericUpDown.Value = 2099999m;
			}
			if (P1_P2Const_numericUpDown.Value > 99999m)
			{
				P1_P2Const_numericUpDown.Value = 99999m;
			}
			P1_P2Const_numericUpDown.Maximum = 99999m;
			if (P1_P2Const_numericUpDown.Value <= 9999m)
			{
				P1_P2Const_numericUpDown.Value = 99999m;
			}
		}
		else
		{
			P1_P1_ItemFlag_numericUpDown.Maximum = 99m;
			if (P1_P1_ItemFlag_numericUpDown.Value <= 9m)
			{
				P1_P1_ItemFlag_numericUpDown.Value = 20m;
			}
			if (P1_P1_2SumFlag_numericUpDown.Value > 99999999m)
			{
				P1_P1_2SumFlag_numericUpDown.Value = 20999999m;
			}
			P1_P1_2SumFlag_numericUpDown.Maximum = 99999999m;
			if (P1_P1_2SumFlag_numericUpDown.Value <= 9999999m)
			{
				P1_P1_2SumFlag_numericUpDown.Value = 20999999m;
			}
			if (P1_P2Const_numericUpDown.Value > 999999m)
			{
				P1_P2Const_numericUpDown.Value = 999999m;
			}
			P1_P2Const_numericUpDown.Maximum = 999999m;
			if (P1_P2Const_numericUpDown.Value <= 99999m)
			{
				P1_P2Const_numericUpDown.Value = 999999m;
			}
		}
		P1_P4Amount_radioButton.Checked = !P1_P3Amount_radioButton.Checked;
		P1_P4Total_radioButton.Checked = !P1_P3Total_radioButton.Checked;
		if (Mode_LabelPrint_RadioButton.Checked)
		{
			P1_Part7_groupBox.Visible = !Mode_OneItemOnly_checkBox.Checked;
			P1_Part1_2Sum_groupBox.Visible = !Mode_OneItemOnly_checkBox.Checked && P1_P7_SumEAN_RadioButton.Checked;
			P1_Part3_4Sum_groupBox.Visible = !Mode_OneItemOnly_checkBox.Checked && P1_P7_SumEAN_RadioButton.Checked && (P1_P3Amount_radioButton.Checked || P1_Part4_groupBox.Visible);
		}
		else
		{
			GroupBox p1_Part7_groupBox = P1_Part7_groupBox;
			GroupBox p1_Part3_4Sum_groupBox = P1_Part3_4Sum_groupBox;
			bool flag = (P1_Part1_2Sum_groupBox.Visible = false);
			bool visible = (p1_Part3_4Sum_groupBox.Visible = flag);
			p1_Part7_groupBox.Visible = visible;
		}
		P1_P2Const_numericUpDown.Enabled = P1_P2Const_radioButton.Checked;
		InfoUpdate();
	}

	private void InfoResize()
	{
		barcode_CashRegister_Info_Label.Font = new Font(barcode_CashRegister_Info_Label.Font.FontFamily, 15f, FontStyle.Bold);
		while (barcode_CashRegister_Info_Panel.Width <= barcode_CashRegister_Info_Label.Width)
		{
			barcode_CashRegister_Info_Label.Font = new Font(barcode_CashRegister_Info_Label.Font.FontFamily, (float)((double)barcode_CashRegister_Info_Label.Font.Size - 0.2), FontStyle.Bold);
		}
		barcode_CashRegister_Info_Label.Location = new Point((barcode_CashRegister_Info_Panel.Width - barcode_CashRegister_Info_Label.Width) / 2, (barcode_CashRegister_Info_Panel.Height - barcode_CashRegister_Info_Label.Height) / 2);
	}

	private void InfoUpdate()
	{
		int num = (ctSC.Barcode_CR_Type = Barcode_CR_Type_GetInt());
		int[] array = new int[5];
		int num2 = 5;
		while (num2 > 0)
		{
			num2--;
			array[num2] = num % 10;
			num /= 10;
		}
		string arg = P1_P1_label.Text + "(" + P1_P1_ItemFlag_numericUpDown.Value.ToString(Program.GetZeroString(array[0])) + ")";
		string text = string.Format(Program.GetLang("pw_XxxDigitsYyy"), array[0].ToString(), arg);
		text = text + ", " + string.Format(arg1: P1_P2ItemCode_radioButton.Checked ? P1_P2ItemCode_radioButton.Text : ((!P1_P2PLUNumber_radioButton.Checked) ? (P1_P2Const_radioButton.Text + "(" + P1_P2Const_numericUpDown.Value.ToString(Program.GetZeroString(array[1])) + ")") : P1_P2PLUNumber_radioButton.Text), format: Program.GetLang("pw_XxxDigitsYyy"), arg0: array[1].ToString());
		text = text + ", " + string.Format(arg1: (!P1_P3Total_radioButton.Checked) ? P1_P3Amount_radioButton.Text : P1_P3Total_radioButton.Text, format: Program.GetLang("pw_XxxDigitsYyy"), arg0: array[2].ToString());
		if (array[3] != 0)
		{
			text = text + ", " + string.Format(arg1: (!P1_P4Total_radioButton.Checked) ? P1_P4Amount_radioButton.Text : P1_P4Total_radioButton.Text, format: Program.GetLang("pw_XxxDigitsYyy"), arg0: array[3].ToString());
		}
		text = text + ", " + string.Format(Program.GetLang("pw_XxxDigitsYyy"), array[4].ToString(), P1_Part5_groupBox.Text);
		barcode_CashRegister_Info_Label.Text = text;
		InfoResize();
	}

	private void CheckOld()
	{
		if (BarNum_NumericUpDown.Value != 6m)
		{
			Version_Error_Label.Visible = true;
			return;
		}
		for (int i = 0; i < 32; i++)
		{
			if (BarItemBox[i].NewVersionOnly())
			{
				Version_Error_Label.Visible = true;
				return;
			}
		}
		Version_Error_Label.Visible = false;
	}

	private void TChar_Changed()
	{
		if (!TChar_In)
		{
			string text = "";
			for (int i = 0; (decimal)i < BarNum_NumericUpDown.Value; i++)
			{
				text += BarItemBox[i].StringOut();
			}
			SaveConfig saveConfig = ctSC;
			string barcode_ME_Source = (TChar_TextBox.Text = text);
			saveConfig.Barcode_ME_Source = barcode_ME_Source;
		}
		CheckOld();
	}

	private void TChar_Changed(object sender, EventArgs e)
	{
		TChar_Changed();
	}

	private void BarNum_NumericUpDown_ValueChanged()
	{
		for (int i = 0; i < 32; i++)
		{
			BarItemBox[i].Visible = BarNum_NumericUpDown.Value > (decimal)i;
		}
		BarSub_TableLayoutPanel.Size = new Size(BarSub_TableLayoutPanel.Size.Width, TE2_label.Location.Y + TE2_label.Size.Height);
	}

	private void BarNum_NumericUpDown_ValueChanged(object sender, EventArgs e)
	{
		BarNum_NumericUpDown_ValueChanged();
		TChar_Changed();
	}

	private void barcode_MainType_RadioButton_CheckedChanged(object sender, EventArgs e)
	{
		if (barcode_CashRegister_RadioButton.Checked)
		{
			barcode_CashRegister_Panel.Visible = true;
			barcode_Special_Panel.Visible = false;
			barcode_ManualEdit_Panel.Visible = false;
			barcode_Special_Panel.Enabled = false;
			barcode_ManualEdit_Panel.Enabled = false;
			BarSub_TableLayoutPanel.Visible = false;
			barcode_CashRegister_Panel.Enabled = true;
			ctSC.Barcode_Main = 0;
		}
		else if (barcode_Special_RadioButton.Checked)
		{
			barcode_CashRegister_Panel.Visible = false;
			barcode_Special_Panel.Visible = true;
			barcode_ManualEdit_Panel.Visible = false;
			barcode_CashRegister_Panel.Enabled = false;
			barcode_ManualEdit_Panel.Enabled = false;
			BarSub_TableLayoutPanel.Visible = false;
			barcode_Special_Panel.Enabled = true;
			ctSC.Barcode_Main = 1;
		}
		else if (barcode_ManualEdit_RadioButton.Checked)
		{
			barcode_CashRegister_Panel.Visible = false;
			barcode_Special_Panel.Visible = false;
			barcode_ManualEdit_Panel.Visible = true;
			BarNum_NumericUpDown_ValueChanged();
			barcode_CashRegister_Panel.Enabled = false;
			barcode_Special_Panel.Enabled = false;
			barcode_ManualEdit_Panel.Enabled = true;
			BarSub_TableLayoutPanel.Visible = true;
			ctSC.Barcode_Main = 2;
		}
	}

	private void blink_add(Control cl)
	{
		foreach (BLINK item in blink)
		{
			if (item.cl == cl)
			{
				return;
			}
		}
		BLINK bLINK = new BLINK();
		bLINK.cl = cl;
		bLINK.text = cl.Text;
		blink.Add(bLINK);
	}

	private void blink_remove(Control cl)
	{
		foreach (BLINK item in blink)
		{
			if (item.cl == cl)
			{
				if (cl.Text == "")
				{
					cl.Text = item.text;
				}
				blink.Remove(item);
				break;
			}
		}
	}

	private void blink_Timer_Tick(object sender, EventArgs e)
	{
		foreach (BLINK item in blink)
		{
			if (item.cl.Text != "" && item.cl.Text != item.text)
			{
				item.text = item.cl.Text;
			}
			blinkFlag = !blinkFlag;
			if (blinkFlag)
			{
				item.cl.Text = "";
			}
			else
			{
				item.cl.Text = item.text;
			}
		}
	}

	private void pt_Picture_PictureBox_Click(object sender, EventArgs e)
	{
		if (pt_Picture_PictureBox.Image == null)
		{
			return;
		}
		using WizardPicReviewForm wizardPicReviewForm = new WizardPicReviewForm(pt_Picture_PictureBox.Image);
		wizardPicReviewForm.ShowDialog(this);
	}

	private void barcode_Special_XXX_RadioButton_CheckedChanged(object sender, EventArgs e)
	{
		barcode_Special_PLUInfo_ComboBox.Enabled = barcode_Special_PLUInfo_RadioButton.Checked;
		barcode_Special_Constant_TextBox.Enabled = barcode_Special_Constant_RadioButton.Checked;
		if (barcode_Special_PLUInfo_RadioButton.Checked)
		{
			ctSC.Barcode_SP_Type = 0;
		}
		else
		{
			ctSC.Barcode_SP_Type = 1;
		}
	}

	private void pluDataElement_ToolStripButton_Click(object sender, EventArgs e)
	{
		using CheckListForm checkListForm = new CheckListForm(3, new string[29]
		{
			pluidDataGridViewTextBoxColumn.HeaderText, nameDataGridViewTextBoxColumn.HeaderText, unitidDataGridViewTextBoxColumn.HeaderText, priceDataGridViewTextBoxColumn.HeaderText, remarkDataGridViewTextBoxColumn.HeaderText, indexDataGridViewTextBoxColumn.HeaderText, costDataGridViewTextBoxColumn.HeaderText, ps_ud_DataGridViewTextBoxColumn.HeaderText, tareDataGridViewTextBoxColumn.HeaderText, classidDataGridViewTextBoxColumn.HeaderText,
			taxtypeDataGridViewTextBoxColumn.HeaderText, labelID1DataGridViewTextBoxColumn.HeaderText, barT1DataGridViewTextBoxColumn.HeaderText, barF1DataGridViewTextBoxColumn.HeaderText, labelID2DataGridViewTextBoxColumn.HeaderText, barT2DataGridViewTextBoxColumn.HeaderText, barF2DataGridViewTextBoxColumn.HeaderText, bitmapDataGridViewComboBoxColumn.HeaderText, text1DataGridViewTextBoxColumn.HeaderText, text2DataGridViewTextBoxColumn.HeaderText,
			text3DataGridViewTextBoxColumn.HeaderText, text4DataGridViewTextBoxColumn.HeaderText, text5DataGridViewTextBoxColumn.HeaderText, text6DataGridViewTextBoxColumn.HeaderText, text7DataGridViewTextBoxColumn.HeaderText, sspValue1DataGridViewTextBoxColumn.HeaderText, sspValue2DataGridViewTextBoxColumn.HeaderText, sspValue3DataGridViewTextBoxColumn.HeaderText, sspValue4DataGridViewTextBoxColumn.HeaderText
		}, new string[3]
		{
			pluDataElement_ToolStripButton.Text,
			Program.GetLang("pw_OK"),
			Program.GetLang("pw_Cancel")
		});
		checkListForm.DefaultChecked(new bool[29]
		{
			pluidDataGridViewTextBoxColumn.Visible, nameDataGridViewTextBoxColumn.Visible, unitidDataGridViewTextBoxColumn.Visible, priceDataGridViewTextBoxColumn.Visible, remarkDataGridViewTextBoxColumn.Visible, indexDataGridViewTextBoxColumn.Visible, costDataGridViewTextBoxColumn.Visible, ps_ud_DataGridViewTextBoxColumn.Visible, tareDataGridViewTextBoxColumn.Visible, classidDataGridViewTextBoxColumn.Visible,
			taxtypeDataGridViewTextBoxColumn.Visible, labelID1DataGridViewTextBoxColumn.Visible, barT1DataGridViewTextBoxColumn.Visible, barF1DataGridViewTextBoxColumn.Visible, labelID2DataGridViewTextBoxColumn.Visible, barT2DataGridViewTextBoxColumn.Visible, barF2DataGridViewTextBoxColumn.Visible, bitmapDataGridViewComboBoxColumn.Visible, text1DataGridViewTextBoxColumn.Visible, text2DataGridViewTextBoxColumn.Visible,
			text3DataGridViewTextBoxColumn.Visible, text4DataGridViewTextBoxColumn.Visible, text5DataGridViewTextBoxColumn.Visible, text6DataGridViewTextBoxColumn.Visible, text7DataGridViewTextBoxColumn.Visible, sspValue1DataGridViewTextBoxColumn.Visible, sspValue2DataGridViewTextBoxColumn.Visible, sspValue3DataGridViewTextBoxColumn.Visible, sspValue4DataGridViewTextBoxColumn.Visible
		});
		checkListForm.DefaultEnabled(new bool[29]
		{
			false, false, false, false, true, true, true, true, true, true,
			true, true, true, true, true, true, true, true, true, true,
			true, true, true, true, true, true, true, true, true
		});
		if (checkListForm.ShowDialog(this) == DialogResult.OK)
		{
			ctSC.PLU_Remark = checkListForm.Checked(4);
			ctSC.PLU_Index = checkListForm.Checked(5);
			ctSC.PLU_PS_UD = checkListForm.Checked(6);
			ctSC.PLU_Cost = checkListForm.Checked(7);
			ctSC.PLU_Tare = checkListForm.Checked(8);
			ctSC.PLU_Class = checkListForm.Checked(9);
			ctSC.PLU_Tax = checkListForm.Checked(10);
			ctSC.PLU_labelID1 = checkListForm.Checked(11);
			ctSC.PLU_barT1 = checkListForm.Checked(12);
			ctSC.PLU_barF1 = checkListForm.Checked(13);
			ctSC.PLU_labelID2 = checkListForm.Checked(14);
			ctSC.PLU_barT2 = checkListForm.Checked(15);
			ctSC.PLU_barF2 = checkListForm.Checked(16);
			ctSC.PLU_Bitmap = checkListForm.Checked(17);
			ctSC.PLU_Text1 = checkListForm.Checked(18);
			ctSC.PLU_Text2 = checkListForm.Checked(19);
			ctSC.PLU_Text3 = checkListForm.Checked(20);
			ctSC.PLU_Text4 = checkListForm.Checked(21);
			ctSC.PLU_Text5 = checkListForm.Checked(22);
			ctSC.PLU_Text6 = checkListForm.Checked(23);
			ctSC.PLU_Text7 = checkListForm.Checked(24);
			ctSC.PLU_SspValue1 = checkListForm.Checked(25);
			ctSC.PLU_SspValue2 = checkListForm.Checked(26);
			ctSC.PLU_SspValue3 = checkListForm.Checked(27);
			ctSC.PLU_SspValue4 = checkListForm.Checked(28);
			plu_part_CheckedChanged();
		}
	}

	private void plu_part_CheckedChanged()
	{
		pluidDataGridViewTextBoxColumn.Visible = true;
		nameDataGridViewTextBoxColumn.Visible = true;
		unitidDataGridViewTextBoxColumn.Visible = true;
		priceDataGridViewTextBoxColumn.Visible = true;
		remarkDataGridViewTextBoxColumn.Visible = ctSC.PLU_Remark;
		indexDataGridViewTextBoxColumn.Visible = ctSC.PLU_Index;
		ps_ud_DataGridViewTextBoxColumn.Visible = ctSC.PLU_PS_UD;
		costDataGridViewTextBoxColumn.Visible = ctSC.PLU_Cost;
		tareDataGridViewTextBoxColumn.Visible = ctSC.PLU_Tare;
		classidDataGridViewTextBoxColumn.Visible = ctSC.PLU_Class;
		DataGridViewTextBoxColumn dataGridViewTextBoxColumn = taxtextDataGridViewTextBoxColumn;
		bool visible = (taxtypeDataGridViewTextBoxColumn.Visible = ctSC.PLU_Tax);
		dataGridViewTextBoxColumn.Visible = visible;
		sspValue1DataGridViewTextBoxColumn.Visible = ctSC.PLU_SspValue1 && sspValue1DataGridViewTextBoxColumn.HeaderText.Length > 0;
		sspValue2DataGridViewTextBoxColumn.Visible = ctSC.PLU_SspValue2 && sspValue2DataGridViewTextBoxColumn.HeaderText.Length > 0;
		sspValue3DataGridViewTextBoxColumn.Visible = ctSC.PLU_SspValue3 && sspValue3DataGridViewTextBoxColumn.HeaderText.Length > 0;
		sspValue4DataGridViewTextBoxColumn.Visible = ctSC.PLU_SspValue4 && sspValue4DataGridViewTextBoxColumn.HeaderText.Length > 0;
		labelID1DataGridViewTextBoxColumn.Visible = ctSC.PLU_labelID1;
		barT1DataGridViewTextBoxColumn.Visible = ctSC.PLU_barT1;
		barF1DataGridViewTextBoxColumn.Visible = ctSC.PLU_barF1;
		labelID2DataGridViewTextBoxColumn.Visible = ctSC.PLU_labelID2;
		barT2DataGridViewTextBoxColumn.Visible = ctSC.PLU_barT2;
		barF2DataGridViewTextBoxColumn.Visible = ctSC.PLU_barF2;
		bitmapDataGridViewComboBoxColumn.Visible = ctSC.PLU_Bitmap;
		text1DataGridViewTextBoxColumn.Visible = ctSC.PLU_Text1;
		text2DataGridViewTextBoxColumn.Visible = ctSC.PLU_Text2;
		text3DataGridViewTextBoxColumn.Visible = ctSC.PLU_Text3;
		text4DataGridViewTextBoxColumn.Visible = ctSC.PLU_Text4;
		text5DataGridViewTextBoxColumn.Visible = ctSC.PLU_Text5;
		text6DataGridViewTextBoxColumn.Visible = ctSC.PLU_Text6;
		text7DataGridViewTextBoxColumn.Visible = ctSC.PLU_Text7;
	}

	private void pLUDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private string GetPLUName(int PLUID)
	{
		if (PLUID >= 0)
		{
			ECSDataSet.PLURow pLURow = eCSDataSet.PLU.FindByPLUID(PLUID);
			if (pLURow == null)
			{
				return string.Empty;
			}
			return pLURow.Name;
		}
		for (int i = 0; i < ctFuc.Length; i++)
		{
			if (ctFuc[i].Value == -PLUID)
			{
				return ctFuc[i].Display;
			}
		}
		return string.Empty;
	}

	private int GetFacePLUa(int page, int offset)
	{
		return eCSDataSet.Face.FindByScaleIDKeyIDPageID((string)faceListComboBox.SelectedValue, offset, page)?.PLUID ?? 0;
	}

	private void UpdateFacePLUa(int page, int offset, int PLUID)
	{
		ECSDataSet.FaceRow faceRow = eCSDataSet.Face.FindByScaleIDKeyIDPageID((string)faceListComboBox.SelectedValue, offset, page);
		if (faceRow != null)
		{
			faceRow.PLUID = PLUID;
			return;
		}
		ECSDataSet.FaceListRow parentFaceListRowByKF_FaceList_Face = eCSDataSet.FaceList.FindByScaleID((string)faceListComboBox.SelectedValue);
		eCSDataSet.Face.AddFaceRow(parentFaceListRowByKF_FaceList_Face, offset, page, PLUID);
	}

	private void ClearFacePLUa(int page, int offset)
	{
		eCSDataSet.Face.FindByScaleIDKeyIDPageID((string)faceListComboBox.SelectedValue, offset, page)?.Delete();
	}

	private void ChangeFace()
	{
		if (layoutComboBox.SelectedValue == null || faceComboBox.SelectedValue == null)
		{
			return;
		}
		_layout = layoutComboBox.SelectedValue.ToString();
		_page = faceComboBox.SelectedValue.ToString();
		string fileName = Application.StartupPath + "\\ScPLU\\" + _layout + ".xml";
		uIDataSet.ScPLU_PageInfo.Clear();
		uIDataSet.ScPLU_Section.Clear();
		uIDataSet.ScPLU_PageInfo.ReadXml(fileName);
		uIDataSet.ScPLU_Section.ReadXml(fileName);
		UIDataSet.ScPLU_PageInfoRow scPLU_PageInfoRow = (UIDataSet.ScPLU_PageInfoRow)uIDataSet.ScPLU_PageInfo.Rows.Find(new object[1] { _page });
		if (scPLU_PageInfoRow != null)
		{
			_bitmap = new Bitmap(Application.StartupPath + "\\ScPLU\\" + scPLU_PageInfoRow.Bitmap);
			using (Graphics graphics = CreateGraphics())
			{
				_dpiGx = graphics.DpiX;
				_dpiGy = graphics.DpiY;
			}
			_dpiBx = _bitmap.HorizontalResolution;
			_dpiBy = _bitmap.VerticalResolution;
			myPanel.Width = (int)((float)_bitmap.Width * _dpiGx / _dpiBx);
			myPanel.Height = (int)((float)_bitmap.Height * _dpiGy / _dpiBy);
			myPanel.Invalidate();
		}
	}

	private void pictureBox_MouseClick(object sender, MouseEventArgs e)
	{
		Point pt = new Point((int)((float)e.X * _dpiBx / _dpiGx), (int)((float)e.Y * _dpiBy / _dpiGy));
		foreach (UIDataSet.ScPLU_SectionRow item in uIDataSet.ScPLU_Section)
		{
			if (!(item.Page == _page))
			{
				continue;
			}
			for (int i = 0; i < item.Num_Y; i++)
			{
				for (int j = 0; j < item.Num_X; j++)
				{
					if (!new Rectangle(item.Start_X + j * item.Offset_X, item.Start_Y + i * item.Offset_Y, item.Rect_X, item.Rect_Y).Contains(pt))
					{
						continue;
					}
					int facePLUa = GetFacePLUa(item.Data_Page, item.Data_Offset + j + i * item.Num_X);
					using (SelForm selForm = new SelForm())
					{
						selForm.PLU = facePLUa;
						switch (selForm.ShowDialog(this))
						{
						case DialogResult.OK:
							UpdateFacePLUa(item.Data_Page, item.Data_Offset + j + i * item.Num_X, selForm.PLU);
							break;
						case DialogResult.Ignore:
							UpdateFacePLUa(item.Data_Page, item.Data_Offset + j + i * item.Num_X, 0);
							break;
						}
						pluTableAdapter.Fill(eCSDataSet.PLU);
					}
					myPanel.Invalidate();
					return;
				}
			}
		}
	}

	private void pictureBox_MouseMove(object sender, MouseEventArgs e)
	{
		Point pt = new Point((int)((float)e.X * _dpiBx / _dpiGx), (int)((float)e.Y * _dpiBy / _dpiGy));
		foreach (UIDataSet.ScPLU_SectionRow item in uIDataSet.ScPLU_Section)
		{
			if (!(item.Page == _page))
			{
				continue;
			}
			for (int i = 0; i < item.Num_Y; i++)
			{
				for (int j = 0; j < item.Num_X; j++)
				{
					if (new Rectangle(item.Start_X + j * item.Offset_X, item.Start_Y + i * item.Offset_Y, item.Rect_X, item.Rect_Y).Contains(pt))
					{
						myPanel.Cursor = Cursors.Hand;
						return;
					}
				}
			}
		}
		myPanel.Cursor = Cursors.Arrow;
	}

	private static ImageCodecInfo GetEncoderInfo(string mimeType)
	{
		ImageCodecInfo[] imageEncoders = ImageCodecInfo.GetImageEncoders();
		for (int i = 0; i < imageEncoders.Length; i++)
		{
			if (imageEncoders[i].MimeType == mimeType)
			{
				return imageEncoders[i];
			}
		}
		return null;
	}

	private static void SaveJPGWithCompressionSetting(Image image, string szFileName, long lCompression)
	{
		EncoderParameters encoderParameters = new EncoderParameters(1);
		encoderParameters.Param[0] = new EncoderParameter(Encoder.Quality, lCompression);
		ImageCodecInfo encoderInfo = GetEncoderInfo("image/jpeg");
		image.Save(szFileName, encoderInfo, encoderParameters);
	}

	private Bitmap DrawFace_bmp()
	{
		Bitmap bitmap = new Bitmap(_bitmap);
		bitmap.SetResolution(_bitmap.HorizontalResolution, _bitmap.VerticalResolution);
		bitmap.SetResolution(_bitmap.HorizontalResolution, _bitmap.VerticalResolution);
		using Graphics graphics = Graphics.FromImage(bitmap);
		StringFormat stringFormat = new StringFormat();
		stringFormat.Alignment = StringAlignment.Center;
		stringFormat.LineAlignment = StringAlignment.Center;
		StringFormat stringFormat2 = new StringFormat();
		stringFormat2.Alignment = StringAlignment.Far;
		stringFormat2.LineAlignment = StringAlignment.Far;
		foreach (UIDataSet.ScPLU_SectionRow item in uIDataSet.ScPLU_Section)
		{
			if (!(item.Page == _page))
			{
				continue;
			}
			for (int i = 0; i < item.Num_Y; i++)
			{
				for (int j = 0; j < item.Num_X; j++)
				{
					int facePLUa = GetFacePLUa(item.Data_Page, item.Data_Offset + j + i * item.Num_X);
					if (facePLUa != 0)
					{
						string pLUName = GetPLUName(facePLUa);
						graphics.DrawString(pLUName, _font, Brushes.Black, new RectangleF(item.Start_X + j * item.Offset_X, item.Start_Y + i * item.Offset_Y, item.Rect_X, item.Rect_Y), stringFormat);
						if (idCheckBox.Checked && facePLUa > 0)
						{
							graphics.DrawString(facePLUa.ToString(), _idFont, Brushes.Black, new RectangleF(item.Start_X + j * item.Offset_X, item.Start_Y + i * item.Offset_Y + item.Rect_Y / 2, item.Rect_X, item.Rect_Y / 2), stringFormat2);
						}
					}
				}
			}
		}
		return bitmap;
	}

	private void myPanel_Paint(object sender, PaintEventArgs e)
	{
		Graphics graphics = e.Graphics;
		Bitmap image = DrawFace_bmp();
		graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
		graphics.DrawImage(image, new Point(0, 0));
	}

	private void AM_xxx_checkbox_CheckChanged(object sender, EventArgs e)
	{
		SaveConfig saveConfig = ctSC;
		bool pW_Admin_Sel = (P5_AM_Admin_textBox.Enabled = P5_AM_Admin_checkBox.Checked);
		saveConfig.PW_Admin_Sel = pW_Admin_Sel;
		ctSC.PW_Admin_String = P5_AM_Admin_textBox.Text;
		SaveConfig saveConfig2 = ctSC;
		bool pW_Sale_Sel = (P5_AM_Sale_textBox.Enabled = P5_AM_Sale_checkBox.Checked);
		saveConfig2.PW_Sale_Sel = pW_Sale_Sel;
		ctSC.PW_Sale_String = P5_AM_Sale_textBox.Text;
		SaveConfig saveConfig3 = ctSC;
		bool pW_Prog_Sel = (P5_AM_Prog_textBox.Enabled = P5_AM_Prog_checkBox.Checked);
		saveConfig3.PW_Prog_Sel = pW_Prog_Sel;
		ctSC.PW_Prog_String = P5_AM_Prog_textBox.Text;
		SaveConfig saveConfig4 = ctSC;
		bool pW_Account_Sel = (P5_AM_Account_textBox.Enabled = P5_AM_Account_checkBox.Checked);
		saveConfig4.PW_Account_Sel = pW_Account_Sel;
		ctSC.PW_Account_String = P5_AM_Account_textBox.Text;
		SaveConfig saveConfig5 = ctSC;
		bool pW_Drawer_Sel = (P5_AM_Drawer_textBox.Enabled = P5_AM_Drawer_checkBox.Checked);
		saveConfig5.PW_Drawer_Sel = pW_Drawer_Sel;
		ctSC.PW_Drawer_String = P5_AM_Drawer_textBox.Text;
		SaveConfig saveConfig6 = ctSC;
		bool pW_PriceFProg_Sel = (P5_AM_PriceFProg_textBox.Enabled = P5_AM_PriceFProg_checkBox.Checked);
		saveConfig6.PW_PriceFProg_Sel = pW_PriceFProg_Sel;
		ctSC.PW_PriceFProg_String = P5_AM_PriceFProg_textBox.Text;
	}

	private void INT7_TextBox_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == '.')
		{
			e.Handled = true;
		}
		else if (e.KeyChar != '\b')
		{
			if (e.KeyChar == '\r')
			{
				e.Handled = true;
			}
			else if (e.KeyChar < '0' || e.KeyChar > '9')
			{
				e.Handled = true;
			}
		}
		int num = Program.ParseInt(((TextBox)sender).Text);
		if (num == 0 && e.KeyChar == '0')
		{
			e.Handled = true;
		}
		if (num >= 1000000)
		{
			((TextBox)sender).Text = (num % 1000000).ToString();
		}
		((TextBox)sender).SelectionStart = 6;
		((TextBox)sender).SelectionLength = 0;
	}

	private void adminInCharge_CheckChanged(object sender, EventArgs e)
	{
		ctSC.MG_AdminInCharge = (Reprint_CheckBox.Checked ? 1 : 0) | (Preprint_CheckBox.Checked ? 2 : 0) | (TSaleWT_CheckBox.Checked ? 4 : 0) | (TSaleCT_CheckBox.Checked ? 8 : 0) | (ItemQuit_CheckBox.Checked ? 16 : 0) | (Amend_CheckBox.Checked ? 32 : 0) | (HangupWrite_CheckBox.Checked ? 64 : 0) | (HangupRead_CheckBox.Checked ? 128 : 0) | (FProgPrice_CheckBox.Checked ? 256 : 0) | (BuyBack_CheckBox.Checked ? 512 : 0) | (Drawer_CheckBox.Checked ? 1024 : 0) | (IllegalReboot_CheckBox.Checked ? 2048 : 0);
	}

	private void P5_UnitPrice_State_radioButton_CheckedChanged(object sender, EventArgs e)
	{
		if (P5_UnitPrice_Allowed_radioButton.Checked)
		{
			P5_PriceFProg_1_radioButton.Enabled = true;
		}
		else
		{
			P5_PriceFProg_1_radioButton.Enabled = false;
		}
		ctSC.MG_UnitPriceChangeForbidden = P5_UnitPrice_Forbidden_radioButton.Checked;
	}

	private void P5_GrandTotal_State_radioButton_CheckedChanged(object sender, EventArgs e)
	{
		ctSC.MG_GrandTotalChangeForbidden = P5_TotalPrice_Forbidden_radioButton.Checked;
	}

	private void P5_VBuffer_x_radioButton_CheckChanged(object sender, EventArgs e)
	{
		if (P5_VBuffer_1_radioButton.Checked)
		{
			ctSC.MG_AccuClear = 1;
		}
		else if (P5_VBuffer_2_radioButton.Checked)
		{
			ctSC.MG_AccuClear = 2;
		}
		else if (P5_VBuffer_3_radioButton.Checked)
		{
			ctSC.MG_AccuClear = 3;
		}
		else if (P5_VBuffer_4_radioButton.Checked)
		{
			ctSC.MG_AccuClear = 4;
		}
		else if (P5_VBuffer_0_radioButton.Checked)
		{
			ctSC.MG_AccuClear = 0;
		}
	}

	private void P5_Unconfirmed_x_radioButton_CheckChanged(object sender, EventArgs e)
	{
		if (P5_Unconfirmed_1_radioButton.Checked)
		{
			ctSC.MG_Unconfirm = 1;
		}
		else if (P5_Unconfirmed_2_radioButton.Checked)
		{
			ctSC.MG_Unconfirm = 2;
		}
		else if (P5_Unconfirmed_0_radioButton.Checked)
		{
			ctSC.MG_Unconfirm = 0;
		}
	}

	private void MG_xxxRight_RadioButton_CheckChanged(object sender, EventArgs e)
	{
		GroupBox groupBox = mg_AdminIC_groupBox;
		GroupBox p5_UnitPrice_groupBox = P5_UnitPrice_groupBox;
		GroupBox p5_TotalPrice_groupBox = P5_TotalPrice_groupBox;
		GroupBox p5_VBuffer_groupBox = P5_VBuffer_groupBox;
		GroupBox p5_Unconfirmed_groupBox = P5_Unconfirmed_groupBox;
		bool flag = (P5_ZeroBack_groupBox.Enabled = false);
		bool flag3 = (p5_Unconfirmed_groupBox.Enabled = flag);
		bool flag5 = (p5_VBuffer_groupBox.Enabled = flag3);
		bool flag7 = (p5_TotalPrice_groupBox.Enabled = flag5);
		bool enabled = (p5_UnitPrice_groupBox.Enabled = flag7);
		groupBox.Enabled = enabled;
		int num = Program.ParseInt(Program.GetLang("pw_ZeroReturnForWeightSale_Value"), 1);
		if (MG_FullRight_RadioButton.Checked)
		{
			P5_TotalPrice_Allowed_radioButton.Checked = true;
			P5_UnitPrice_Allowed_radioButton.Checked = true;
			P5_Unconfirmed_1_radioButton.Checked = true;
			P5_VBuffer_3_radioButton.Checked = true;
			GetAdminInCharge(0);
			ctSC.MG_xxxRight = "Full";
		}
		else if (MG_LimitedRight_RadioButton.Checked)
		{
			P5_TotalPrice_Forbidden_radioButton.Checked = true;
			P5_UnitPrice_Forbidden_radioButton.Checked = true;
			P5_Unconfirmed_1_radioButton.Checked = true;
			P5_VBuffer_3_radioButton.Checked = true;
			GetAdminInCharge(3342);
			num = 3;
			ctSC.MG_xxxRight = "Limited";
		}
		else if (MG_NoRight_RadioButton.Checked)
		{
			P5_TotalPrice_Forbidden_radioButton.Checked = true;
			P5_UnitPrice_Forbidden_radioButton.Checked = true;
			P5_Unconfirmed_2_radioButton.Checked = true;
			P5_VBuffer_3_radioButton.Checked = true;
			GetAdminInCharge(4094);
			num = 3;
			ctSC.MG_xxxRight = "No";
		}
		else if (MG_CustomRight_RadioButton.Checked)
		{
			ctSC.MG_xxxRight = "Custom";
			GroupBox groupBox2 = mg_AdminIC_groupBox;
			GroupBox p5_UnitPrice_groupBox2 = P5_UnitPrice_groupBox;
			GroupBox p5_TotalPrice_groupBox2 = P5_TotalPrice_groupBox;
			GroupBox p5_VBuffer_groupBox2 = P5_VBuffer_groupBox;
			GroupBox p5_Unconfirmed_groupBox2 = P5_Unconfirmed_groupBox;
			bool flag10 = (P5_ZeroBack_groupBox.Enabled = true);
			bool flag12 = (p5_Unconfirmed_groupBox2.Enabled = flag10);
			bool flag14 = (p5_VBuffer_groupBox2.Enabled = flag12);
			bool flag16 = (p5_TotalPrice_groupBox2.Enabled = flag14);
			bool enabled2 = (p5_UnitPrice_groupBox2.Enabled = flag16);
			groupBox2.Enabled = enabled2;
		}
		switch (num)
		{
		case 0:
			P5_ZeroBack_0_radioButton.Checked = true;
			return;
		case 2:
			P5_ZeroBack_2_radioButton.Checked = true;
			return;
		case 3:
			P5_ZeroBack_3_radioButton.Checked = true;
			return;
		}
		switch (num)
		{
		case 3:
			P5_ZeroBack_3_radioButton.Checked = true;
			break;
		case 1:
			P5_ZeroBack_1_radioButton.Checked = true;
			break;
		}
	}

	private void P1_P1_ItemFlag_numericUpDown_ValueChanged(object sender, EventArgs e)
	{
		ctSC.Barcode_CR_Flag_Item = (int)P1_P1_ItemFlag_numericUpDown.Value;
		InfoUpdate();
	}

	private void P1_P1_2SumFlag_numericUpDown_ValueChanged(object sender, EventArgs e)
	{
		ctSC.Barcode_CR_Flag_Sum = (int)P1_P1_2SumFlag_numericUpDown.Value;
	}

	private void P1_Part1_2Sum_UseItem_CheckBox_CheckedChanged(object sender, EventArgs e)
	{
		SaveConfig saveConfig = ctSC;
		bool barcode_CR_Flag_SumUsingItem = (P1_P1_2SumFlag_numericUpDown.Enabled = !P1_Part1_2Sum_UseItem_CheckBox.Checked);
		saveConfig.Barcode_CR_Flag_SumUsingItem = barcode_CR_Flag_SumUsingItem;
	}

	private void P1_P2_ItemValue(object sender, EventArgs e)
	{
		if (P1_P2ItemCode_radioButton.Checked)
		{
			ctSC.Barcode_CR_Item_P2 = -1;
		}
		else if (P1_P2PLUNumber_radioButton.Checked)
		{
			ctSC.Barcode_CR_Item_P2 = -2;
		}
		else
		{
			ctSC.Barcode_CR_Item_P2 = (int)P1_P2Const_numericUpDown.Value;
		}
		P1_P2Const_numericUpDown.Enabled = P1_P2Const_radioButton.Checked;
		InfoUpdate();
	}

	private void P1_P3_ItemValue(object sender, EventArgs e)
	{
		ctSC.Barcode_CR_Item_P3_Weight = P1_P3Amount_radioButton.Checked;
		P1_P4Amount_radioButton.Checked = !P1_P3Amount_radioButton.Checked;
		P1_P4Total_radioButton.Checked = !P1_P3Total_radioButton.Checked;
		P1_Part6_xxxxDecimal_NumericUpDown_Visible();
		InfoUpdate();
	}

	private void P2_P3_ItemValue(object sender, EventArgs e)
	{
		ctSC.Barcode_CR_Sum_UsePcsAsAmount = P1_P3_4TotalPcs_radioButton.Checked;
	}

	private void P1_Px_CheckSum(object sender, EventArgs e)
	{
		if (P1_Check_NS_radioButton.Checked)
		{
			ctSC.Barcode_CR_CheckType = 1;
		}
		else if (P1_Check_C0_radioButton.Checked)
		{
			ctSC.Barcode_CR_CheckType = 2;
		}
		else
		{
			ctSC.Barcode_CR_CheckType = 0;
		}
	}

	private void barcode_Special_Constant_TextBox_TextChanged(object sender, EventArgs e)
	{
		ctSC.Barcode_SP_Constant = barcode_Special_Constant_TextBox.Text;
	}

	private void barcode_Special_PLUInfo_ComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		ctSC.Barcode_SP_PLUInfo = barcode_Special_PLUInfo_ComboBox.SelectedIndex;
	}

	private void barcode_Special_Type_ComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		ctSC.Barcode_SP_BType = barcode_Special_Type_ComboBox.SelectedIndex;
	}

	private void barcode_Special_CheckDigit_CheckBox_CheckedChanged(object sender, EventArgs e)
	{
		ctSC.Barcode_SP_TryAddCheckDigit = barcode_Special_CheckDigit_CheckBox.Checked;
	}

	private void barcode_ManualEdit_CheckDigit_CheckBox_CheckedChanged(object sender, EventArgs e)
	{
		ctSC.Barcode_ME_TryAddCheckDigit = barcode_ManualEdit_CheckDigit_CheckBox.Checked;
	}

	private void barcode_ManualEdit_BType_ComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		ctSC.Barcode_ME_BType = barcode_ManualEdit_BType_ComboBox.SelectedIndex;
	}

	private void bindingNavigatorAddNewItem1_Click(object sender, EventArgs e)
	{
		ECSDataSet.PLURow pLURow = (ECSDataSet.PLURow)((DataRowView)pLUBindingSource.AddNew()).Row;
		if (pLURow != null)
		{
			pLURow.UnitID = Settings.Default.defaultUnitID;
		}
	}

	private void bindingNavigatorDeleteItem1_Click(object sender, EventArgs e)
	{
		if (pLUDataGridView.SelectedRows.Count >= 1)
		{
			foreach (DataGridViewRow selectedRow in pLUDataGridView.SelectedRows)
			{
				if (selectedRow.DataBoundItem is DataRowView dataRowView)
				{
					dataRowView.Row.Delete();
				}
			}
		}
		else
		{
			pLUDataGridView.Rows.Remove(pLUDataGridView.CurrentRow);
		}
		try
		{
			pluTableAdapter.Update(eCSDataSet.PLU);
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private int GetSetting_RadioButton(int Value, RadioButton[] rb, int[] tb)
	{
		if (Value < 0)
		{
			return 1;
		}
		int num = rb.Length;
		if (num != tb.Length)
		{
			return 1;
		}
		while (num != 0)
		{
			num--;
			if (Value == tb[num])
			{
				rb[num].Checked = true;
				return 0;
			}
		}
		return 1;
	}

	private int GetSetting_RadioButton(int Value, RadioButton[] rb)
	{
		int num = rb.Length;
		int[] array = new int[num];
		while (num != 0)
		{
			num--;
			array[num] = num;
		}
		return GetSetting_RadioButton(Value, rb, array);
	}

	private int SaveSetting_RadioButton(RadioButton[] rb, int[] tb)
	{
		int num = rb.Length;
		if (num != tb.Length)
		{
			return 0;
		}
		while (num != 0)
		{
			num--;
			if (rb[num].Checked)
			{
				return tb[num];
			}
		}
		return 0;
	}

	private int SaveSetting_RadioButton(RadioButton[] rb)
	{
		int num = rb.Length;
		int[] array = new int[num];
		while (num != 0)
		{
			num--;
			array[num] = num;
		}
		return SaveSetting_RadioButton(rb, array);
	}

	private void P4_UpdateSoftware_button_Click(object sender, EventArgs e)
	{
		Settings.Default.Format_Price = ctSC.MISC_UPPoint;
		Settings.Default.Save();
		DataGridViewCellStyle defaultCellStyle = priceDataGridViewTextBoxColumn.DefaultCellStyle;
		string format = (costDataGridViewTextBoxColumn.DefaultCellStyle.Format = "F" + Settings.Default.Format_Price);
		defaultCellStyle.Format = format;
	}

	private void P5_BuyBack_A2_checkBox_CheckedChanged(object sender, EventArgs e)
	{
		CheckBox p5_BuyBack_A4_checkBox = P5_BuyBack_A4_checkBox;
		bool enabled = (P5_BuyBack_A16_checkBox.Enabled = P5_BuyBack_A2_checkBox.Checked);
		p5_BuyBack_A4_checkBox.Enabled = enabled;
		P5_BuyBack_A8_checkBox.Enabled = P5_BuyBack_A2_checkBox.Checked || P5_BuyBack_A32_checkBox.Checked || P5_BuyBack_A64_checkBox.Checked || P5_BuyBack_A128_checkBox.Checked || P5_BuyBack_A256_checkBox.Checked || P5_BuyBack_A512_checkBox.Checked;
		if (!P5_BuyBack_A4_checkBox.Enabled)
		{
			P5_BuyBack_A4_checkBox.Checked = false;
		}
		if (!P5_BuyBack_A8_checkBox.Enabled)
		{
			P5_BuyBack_A8_checkBox.Checked = false;
		}
		P5_BuyBack_Ax_checkBox_CheckedChanged(null, null);
	}

	private void P4_UPriceRadixPoint_radioButton_CheckedChanged(object sender, EventArgs e)
	{
		P4_TotalRadixPoint5_radioButton.Checked = P4_UPriceRadixPoint5_radioButton.Checked;
		P4_TotalRadixPoint4_radioButton.Checked = P4_UPriceRadixPoint4_radioButton.Checked;
		P4_TotalRadixPoint3_radioButton.Checked = P4_UPriceRadixPoint3_radioButton.Checked;
		P4_TotalRadixPoint2_radioButton.Checked = P4_UPriceRadixPoint2_radioButton.Checked;
		P4_TotalRadixPoint1_radioButton.Checked = P4_UPriceRadixPoint1_radioButton.Checked;
		P4_TotalRadixPoint0_radioButton.Checked = P4_UPriceRadixPoint0_radioButton.Checked;
		ctSC.MISC_UPPoint = SaveSetting_RadioButton(new RadioButton[6] { P4_UPriceRadixPoint0_radioButton, P4_UPriceRadixPoint1_radioButton, P4_UPriceRadixPoint2_radioButton, P4_UPriceRadixPoint3_radioButton, P4_UPriceRadixPoint4_radioButton, P4_UPriceRadixPoint5_radioButton });
	}

	private void P4_PointEnableCheck()
	{
		bool flag = false;
		bool flag2 = (P4_TotalRadixPoint5_radioButton.Enabled = P4_UPriceRadixPoint5_radioButton.Checked || flag);
		flag = flag2;
		bool flag4 = (P4_TotalRadixPoint4_radioButton.Enabled = P4_UPriceRadixPoint4_radioButton.Checked || flag);
		flag = flag4;
		bool flag6 = (P4_TotalRadixPoint3_radioButton.Enabled = P4_UPriceRadixPoint3_radioButton.Checked || flag);
		flag = flag6;
		bool flag8 = (P4_TotalRadixPoint2_radioButton.Enabled = P4_UPriceRadixPoint2_radioButton.Checked || flag);
		flag = flag8;
		bool flag10 = (P4_TotalRadixPoint1_radioButton.Enabled = P4_UPriceRadixPoint1_radioButton.Checked || flag);
		flag = flag10;
		bool flag12 = (P4_TotalRadixPoint0_radioButton.Enabled = P4_UPriceRadixPoint0_radioButton.Checked || flag);
		flag = flag12;
		flag = false;
		bool flag14 = (P4_TotalRounding0_S0_radioButton.Enabled = P4_ItemRounding0_S0_radioButton.Checked || flag);
		flag = flag14;
		bool flag16 = (P4_TotalRounding1_S9_radioButton.Enabled = P4_ItemRounding1_S9_radioButton.Checked || flag);
		flag = flag16;
		bool flag18 = (P4_TotalRounding2_S1_radioButton.Enabled = P4_ItemRounding2_S1_radioButton.Checked || flag);
		flag = flag18;
		bool flag20 = (P4_TotalRounding3_S10_radioButton.Enabled = P4_ItemRounding3_S10_radioButton.Checked || flag);
		flag = flag20;
		bool flag22 = (P4_TotalRounding4_S2_radioButton.Enabled = P4_ItemRounding4_S2_radioButton.Checked || flag);
		flag = flag22;
	}

	private void P4_TotalRadixPoint_radioButton_CheckedChanged(object sender, EventArgs e)
	{
		if (P4_TotalRadixPoint0_radioButton.Checked)
		{
			RadioButton p4_ItemRounding0_S0_radioButton = P4_ItemRounding0_S0_radioButton;
			string text = (P4_TotalRounding0_S0_radioButton.Text = "1");
			p4_ItemRounding0_S0_radioButton.Text = text;
			RadioButton p4_ItemRounding1_S9_radioButton = P4_ItemRounding1_S9_radioButton;
			string text3 = (P4_TotalRounding1_S9_radioButton.Text = "5");
			p4_ItemRounding1_S9_radioButton.Text = text3;
			RadioButton p4_ItemRounding2_S1_radioButton = P4_ItemRounding2_S1_radioButton;
			string text5 = (P4_TotalRounding2_S1_radioButton.Text = "10");
			p4_ItemRounding2_S1_radioButton.Text = text5;
			RadioButton p4_ItemRounding3_S10_radioButton = P4_ItemRounding3_S10_radioButton;
			string text7 = (P4_TotalRounding3_S10_radioButton.Text = "50");
			p4_ItemRounding3_S10_radioButton.Text = text7;
			RadioButton p4_ItemRounding4_S2_radioButton = P4_ItemRounding4_S2_radioButton;
			string text9 = (P4_TotalRounding4_S2_radioButton.Text = "100");
			p4_ItemRounding4_S2_radioButton.Text = text9;
		}
		else if (P4_TotalRadixPoint1_radioButton.Checked)
		{
			RadioButton p4_ItemRounding0_S0_radioButton2 = P4_ItemRounding0_S0_radioButton;
			string text11 = (P4_TotalRounding0_S0_radioButton.Text = "0.1");
			p4_ItemRounding0_S0_radioButton2.Text = text11;
			RadioButton p4_ItemRounding1_S9_radioButton2 = P4_ItemRounding1_S9_radioButton;
			string text13 = (P4_TotalRounding1_S9_radioButton.Text = "0.5");
			p4_ItemRounding1_S9_radioButton2.Text = text13;
			RadioButton p4_ItemRounding2_S1_radioButton2 = P4_ItemRounding2_S1_radioButton;
			string text15 = (P4_TotalRounding2_S1_radioButton.Text = "1.0");
			p4_ItemRounding2_S1_radioButton2.Text = text15;
			RadioButton p4_ItemRounding3_S10_radioButton2 = P4_ItemRounding3_S10_radioButton;
			string text17 = (P4_TotalRounding3_S10_radioButton.Text = "5.0");
			p4_ItemRounding3_S10_radioButton2.Text = text17;
			RadioButton p4_ItemRounding4_S2_radioButton2 = P4_ItemRounding4_S2_radioButton;
			string text19 = (P4_TotalRounding4_S2_radioButton.Text = "10.0");
			p4_ItemRounding4_S2_radioButton2.Text = text19;
		}
		else if (P4_TotalRadixPoint2_radioButton.Checked)
		{
			RadioButton p4_ItemRounding0_S0_radioButton3 = P4_ItemRounding0_S0_radioButton;
			string text21 = (P4_TotalRounding0_S0_radioButton.Text = "0.01");
			p4_ItemRounding0_S0_radioButton3.Text = text21;
			RadioButton p4_ItemRounding1_S9_radioButton3 = P4_ItemRounding1_S9_radioButton;
			string text23 = (P4_TotalRounding1_S9_radioButton.Text = "0.05");
			p4_ItemRounding1_S9_radioButton3.Text = text23;
			RadioButton p4_ItemRounding2_S1_radioButton3 = P4_ItemRounding2_S1_radioButton;
			string text25 = (P4_TotalRounding2_S1_radioButton.Text = "0.10");
			p4_ItemRounding2_S1_radioButton3.Text = text25;
			RadioButton p4_ItemRounding3_S10_radioButton3 = P4_ItemRounding3_S10_radioButton;
			string text27 = (P4_TotalRounding3_S10_radioButton.Text = "0.50");
			p4_ItemRounding3_S10_radioButton3.Text = text27;
			RadioButton p4_ItemRounding4_S2_radioButton3 = P4_ItemRounding4_S2_radioButton;
			string text29 = (P4_TotalRounding4_S2_radioButton.Text = "1.00");
			p4_ItemRounding4_S2_radioButton3.Text = text29;
		}
		else if (P4_TotalRadixPoint3_radioButton.Checked)
		{
			RadioButton p4_ItemRounding0_S0_radioButton4 = P4_ItemRounding0_S0_radioButton;
			string text31 = (P4_TotalRounding0_S0_radioButton.Text = "0.001");
			p4_ItemRounding0_S0_radioButton4.Text = text31;
			RadioButton p4_ItemRounding1_S9_radioButton4 = P4_ItemRounding1_S9_radioButton;
			string text33 = (P4_TotalRounding1_S9_radioButton.Text = "0.005");
			p4_ItemRounding1_S9_radioButton4.Text = text33;
			RadioButton p4_ItemRounding2_S1_radioButton4 = P4_ItemRounding2_S1_radioButton;
			string text35 = (P4_TotalRounding2_S1_radioButton.Text = "0.010");
			p4_ItemRounding2_S1_radioButton4.Text = text35;
			RadioButton p4_ItemRounding3_S10_radioButton4 = P4_ItemRounding3_S10_radioButton;
			string text37 = (P4_TotalRounding3_S10_radioButton.Text = "0.050");
			p4_ItemRounding3_S10_radioButton4.Text = text37;
			RadioButton p4_ItemRounding4_S2_radioButton4 = P4_ItemRounding4_S2_radioButton;
			string text39 = (P4_TotalRounding4_S2_radioButton.Text = "0.100");
			p4_ItemRounding4_S2_radioButton4.Text = text39;
		}
		else if (P4_TotalRadixPoint4_radioButton.Checked)
		{
			RadioButton p4_ItemRounding0_S0_radioButton5 = P4_ItemRounding0_S0_radioButton;
			string text41 = (P4_TotalRounding0_S0_radioButton.Text = "0.0001");
			p4_ItemRounding0_S0_radioButton5.Text = text41;
			RadioButton p4_ItemRounding1_S9_radioButton5 = P4_ItemRounding1_S9_radioButton;
			string text43 = (P4_TotalRounding1_S9_radioButton.Text = "0.0005");
			p4_ItemRounding1_S9_radioButton5.Text = text43;
			RadioButton p4_ItemRounding2_S1_radioButton5 = P4_ItemRounding2_S1_radioButton;
			string text45 = (P4_TotalRounding2_S1_radioButton.Text = "0.0010");
			p4_ItemRounding2_S1_radioButton5.Text = text45;
			RadioButton p4_ItemRounding3_S10_radioButton5 = P4_ItemRounding3_S10_radioButton;
			string text47 = (P4_TotalRounding3_S10_radioButton.Text = "0.0050");
			p4_ItemRounding3_S10_radioButton5.Text = text47;
			RadioButton p4_ItemRounding4_S2_radioButton5 = P4_ItemRounding4_S2_radioButton;
			string text49 = (P4_TotalRounding4_S2_radioButton.Text = "0.0100");
			p4_ItemRounding4_S2_radioButton5.Text = text49;
		}
		else if (P4_TotalRadixPoint5_radioButton.Checked)
		{
			RadioButton p4_ItemRounding0_S0_radioButton6 = P4_ItemRounding0_S0_radioButton;
			string text51 = (P4_TotalRounding0_S0_radioButton.Text = "0.00001");
			p4_ItemRounding0_S0_radioButton6.Text = text51;
			RadioButton p4_ItemRounding1_S9_radioButton6 = P4_ItemRounding1_S9_radioButton;
			string text53 = (P4_TotalRounding1_S9_radioButton.Text = "0.00005");
			p4_ItemRounding1_S9_radioButton6.Text = text53;
			RadioButton p4_ItemRounding2_S1_radioButton6 = P4_ItemRounding2_S1_radioButton;
			string text55 = (P4_TotalRounding2_S1_radioButton.Text = "0.00010");
			p4_ItemRounding2_S1_radioButton6.Text = text55;
			RadioButton p4_ItemRounding3_S10_radioButton6 = P4_ItemRounding3_S10_radioButton;
			string text57 = (P4_TotalRounding3_S10_radioButton.Text = "0.00050");
			p4_ItemRounding3_S10_radioButton6.Text = text57;
			RadioButton p4_ItemRounding4_S2_radioButton6 = P4_ItemRounding4_S2_radioButton;
			string text59 = (P4_TotalRounding4_S2_radioButton.Text = "0.00100");
			p4_ItemRounding4_S2_radioButton6.Text = text59;
		}
		P4_PointEnableCheck();
		ctSC.MISC_TPPoint = SaveSetting_RadioButton(new RadioButton[6] { P4_TotalRadixPoint0_radioButton, P4_TotalRadixPoint1_radioButton, P4_TotalRadixPoint2_radioButton, P4_TotalRadixPoint3_radioButton, P4_TotalRadixPoint4_radioButton, P4_TotalRadixPoint5_radioButton });
	}

	private void P4_ItemRoundingX_SX_radioButton_CheckedChanged(object sender, EventArgs e)
	{
		P4_TotalRounding0_S0_radioButton.Checked = P4_ItemRounding0_S0_radioButton.Checked;
		P4_TotalRounding1_S9_radioButton.Checked = P4_ItemRounding1_S9_radioButton.Checked;
		P4_TotalRounding2_S1_radioButton.Checked = P4_ItemRounding2_S1_radioButton.Checked;
		P4_TotalRounding3_S10_radioButton.Checked = P4_ItemRounding3_S10_radioButton.Checked;
		P4_TotalRounding4_S2_radioButton.Checked = P4_ItemRounding4_S2_radioButton.Checked;
		P4_PointEnableCheck();
		ctSC.MISC_STRounding = SaveSetting_RadioButton(new RadioButton[5] { P4_ItemRounding0_S0_radioButton, P4_ItemRounding1_S9_radioButton, P4_ItemRounding2_S1_radioButton, P4_ItemRounding3_S10_radioButton, P4_ItemRounding4_S2_radioButton }, new int[5] { 0, 9, 1, 10, 2 });
	}

	private void P4_TotalRoundingX_SX_radioButton_CheckedChanged(object sender, EventArgs e)
	{
		ctSC.MISC_TTRounding = SaveSetting_RadioButton(new RadioButton[5] { P4_TotalRounding0_S0_radioButton, P4_TotalRounding1_S9_radioButton, P4_TotalRounding2_S1_radioButton, P4_TotalRounding3_S10_radioButton, P4_TotalRounding4_S2_radioButton }, new int[5] { 0, 9, 1, 10, 2 });
	}

	private void P5_PriceFProg_x_radioButton_CheckedChanged(object sender, EventArgs e)
	{
		ctSC.MG_PriceFProg = SaveSetting_RadioButton(new RadioButton[5] { P5_PriceFProg_0_radioButton, P5_PriceFProg_1_radioButton, P5_PriceFProg_2_radioButton, P5_PriceFProg_3_radioButton, P5_PriceFProg_4_radioButton });
	}

	private void P5_ZeroReturn_x_radioButton_CheckedChanged(object sender, EventArgs e)
	{
		if (P5_ZeroReturn_3_radioButton.Checked)
		{
			ctSC.MG_ZeroReturn = 3;
		}
		else if (P5_ZeroReturn_4_radioButton.Checked)
		{
			ctSC.MG_ZeroReturn = 4;
		}
		else if (P5_ZeroReturn_0_radioButton.Checked)
		{
			ctSC.MG_ZeroReturn = 3;
		}
		ctSC.MG_ZeroReturn = SaveSetting_RadioButton(new RadioButton[3] { P5_ZeroReturn_0_radioButton, P5_ZeroReturn_3_radioButton, P5_ZeroReturn_4_radioButton }, new int[3] { 0, 3, 4 });
	}

	private void P5_BuyBack_Ax_checkBox_CheckedChanged(object sender, EventArgs e)
	{
		int num = 0;
		if (P5_BuyBack_A1_checkBox.Checked)
		{
			num |= 1;
		}
		if (P5_BuyBack_A2_checkBox.Checked)
		{
			num |= 2;
		}
		if (P5_BuyBack_A4_checkBox.Checked)
		{
			num |= 4;
		}
		if (P5_BuyBack_A8_checkBox.Checked)
		{
			num |= 8;
		}
		if (P5_BuyBack_A16_checkBox.Checked)
		{
			num |= 0x10;
		}
		if (P5_BuyBack_A32_checkBox.Checked)
		{
			num |= 0x20;
		}
		if (P5_BuyBack_A64_checkBox.Checked)
		{
			num |= 0x40;
		}
		if (P5_BuyBack_A128_checkBox.Checked)
		{
			num |= 0x80;
		}
		if (P5_BuyBack_A256_checkBox.Checked)
		{
			num |= 0x100;
		}
		if (P5_BuyBack_A512_checkBox.Checked)
		{
			num |= 0x200;
		}
		ctSC.MG_BuyBack = num;
	}

	private void P5_Payments_Ax_checkBox_CheckedChanged(object sender, EventArgs e)
	{
		int num = 0;
		if (!P5_Payments_A1_checkBox.Checked)
		{
			num |= 1;
		}
		if (!P5_Payments_A2_checkBox.Checked)
		{
			num |= 2;
		}
		if (!P5_Payments_A4_checkBox.Checked)
		{
			num |= 4;
		}
		if (!P5_Payments_A8_checkBox.Checked)
		{
			num |= 5;
		}
		if (!P5_Payments_A16_checkBox.Checked)
		{
			num |= 0x10;
		}
		if (!P5_Payments_A32_checkBox.Checked)
		{
			num |= 0x20;
		}
		ctSC.MG_Payments = num;
	}

	private void P5_Hangup_x_radioButton_CheckedChanged(object sender, EventArgs e)
	{
		ctSC.MG_Hangup = SaveSetting_RadioButton(new RadioButton[4] { P5_Hangup_0_radioButton, P5_Hangup_1_radioButton, P5_Hangup_2_radioButton, P5_Hangup_3_radioButton });
	}

	private void P2_Prefix_textBox_TextChanged(object sender, EventArgs e)
	{
		ctSC.MISC_Prefix = P2_Prefix_textBox.Text;
	}

	private void P2_Suffix_textBox_TextChanged(object sender, EventArgs e)
	{
		ctSC.MISC_Suffix = P2_Suffix_textBox.Text;
	}

	private void P2_PrintUnit_X_Changed()
	{
		P2_PrintUnit_Weight_label.Text = "1.000";
		if (P2_PrintUnit_Amount_checkbox.Checked)
		{
			P2_PrintUnit_Weight_label.Text += P2_PrintUnit_addWeight_label.Text;
		}
		P2_PrintUnit_Pcs_label.Text = "1";
		if (P2_PrintUnit_Amount_checkbox.Checked)
		{
			P2_PrintUnit_Pcs_label.Text += P2_PrintUnit_addPcs_label.Text;
		}
		Label p2_PrintUnit_UPriceWeight_label = P2_PrintUnit_UPriceWeight_label;
		Label p2_PrintUnit_UPricePcs_label = P2_PrintUnit_UPricePcs_label;
		string text = (P2_PrintUnit_Money_label.Text = "1.00");
		string text3 = (p2_PrintUnit_UPricePcs_label.Text = text);
		p2_PrintUnit_UPriceWeight_label.Text = text3;
		if (P2_PrintUnit_UPrice_checkbox.Checked)
		{
			P2_PrintUnit_UPricePcs_label.Text = P2_Prefix_textBox.Text + P2_PrintUnit_UPriceWeight_label.Text + P2_Suffix_textBox.Text + '/' + P2_PrintUnit_addPcs_label.Text;
			P2_PrintUnit_UPriceWeight_label.Text = P2_Prefix_textBox.Text + P2_PrintUnit_UPriceWeight_label.Text + P2_Suffix_textBox.Text + '/' + P2_PrintUnit_addWeight_label.Text;
		}
		if (P2_PrintUnit_Money_checkbox.Checked)
		{
			P2_PrintUnit_Money_label.Text = P2_Prefix_textBox.Text + P2_PrintUnit_Money_label.Text + P2_Suffix_textBox.Text;
		}
	}

	private void P2_PrintUnit_Amount_checkbox_CheckedChanged(object sender, EventArgs e)
	{
		ctSC.MISC_PrintUnit_Amount = P2_PrintUnit_Amount_checkbox.Checked;
		P2_PrintUnit_X_Changed();
	}

	private void P2_PrintUnit_UPrice_checkbox_CheckedChanged(object sender, EventArgs e)
	{
		ctSC.MISC_PrintUnit_UPrice = P2_PrintUnit_UPrice_checkbox.Checked;
		P2_PrintUnit_X_Changed();
	}

	private void P2_PrintUnit_Money_checkbox_CheckedChanged(object sender, EventArgs e)
	{
		ctSC.MISC_PrintUnit_Money = P2_PrintUnit_Money_checkbox.Checked;
		P2_PrintUnit_X_Changed();
	}

	private void P3_PLUinfo_Fontx_radioButton_CheckedChanged(object sender, EventArgs e)
	{
		ctSC.MISC_PLUInfo_Font = SaveSetting_RadioButton(new RadioButton[4] { P3_PLUinfo_Font0_radioButton, P3_PLUinfo_Font1_radioButton, P3_PLUinfo_Font2_radioButton, P3_PLUinfo_Font3_radioButton });
	}

	private void P3_noPLUinfo_Fontx_radioButton_CheckedChanged(object sender, EventArgs e)
	{
		ctSC.MISC_IdleInfo_Font = SaveSetting_RadioButton(new RadioButton[4] { P3_noPLUinfo_Font0_radioButton, P3_noPLUinfo_Font1_radioButton, P3_noPLUinfo_Font2_radioButton, P3_noPLUinfo_Font3_radioButton });
	}

	private void P3_DoubleSource_checkBox_CheckedChanged(object sender, EventArgs e)
	{
		if (P3_PLUinfo_S1_comboBox.SelectedValue != null && P3_PLUinfo_S2_comboBox.SelectedValue != null)
		{
			if (P3_DoubleSource_checkBox.Checked)
			{
				ctSC.MISC_PLUInfo_S1 = (int)P3_PLUinfo_S1_comboBox.SelectedValue;
				ctSC.MISC_PLUInfo_S2 = (int)P3_PLUinfo_S2_comboBox.SelectedValue;
			}
			else
			{
				ctSC.MISC_PLUInfo_S1 = (ctSC.MISC_PLUInfo_S2 = (int)P3_PLUinfo_S1_comboBox.SelectedValue);
				P3_PLUinfo_S2_comboBox.SelectedValue = ctSC.MISC_PLUInfo_S2;
			}
		}
	}

	private void P3_Idleinfo_Sourcex_radioButton_CheckedChanged(object sender, EventArgs e)
	{
		ctSC.MISC_IdleInfo_S = SaveSetting_RadioButton(new RadioButton[4] { P3_Idleinfo_Source0_radioButton, P3_Idleinfo_Source1_radioButton, P3_Idleinfo_Source2_radioButton, P3_Idleinfo_Source3_radioButton });
		ctSC.MISC_IdleInfo_SS = P3_Idleinfo_Source3_textBox.Text;
		P3_Idleinfo_Source3_textBox.Enabled = P3_Idleinfo_Source3_radioButton.Checked;
	}

	private void P3_Accedinfo_Sourcex_radioButton_CheckedChanged(object sender, EventArgs e)
	{
		ctSC.MISC_AccuInfo_S = SaveSetting_RadioButton(new RadioButton[3] { P3_Accedinfo_Source0_radioButton, P3_Accedinfo_Source1_radioButton, P3_Accedinfo_Source2_radioButton });
	}

	private void addButton_Click(object sender, EventArgs e)
	{
		string empty = string.Empty;
		using (InputForm inputForm = new InputForm())
		{
			if (inputForm.ShowDialog(this) != DialogResult.OK || inputForm.inputTextBox.Text.Length == 0)
			{
				return;
			}
			empty = inputForm.inputTextBox.Text;
		}
		if (MessageBox.Show(this, string.Format(Program.GetLang("pw_Add_0__"), empty), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
		{
			try
			{
				ECSDataSet.FaceListRow faceListRow = eCSDataSet.FaceList.NewFaceListRow();
				faceListRow.ScaleID = empty;
				faceListRow.Layout = Settings.Default.defaultSCP;
				faceListRow.PageMode = Settings.Default.defaultSCP_Page;
				eCSDataSet.FaceList.AddFaceListRow(faceListRow);
				for (int i = 0; i < 128; i++)
				{
					ECSDataSet.FaceRow faceRow = eCSDataSet.Face.NewFaceRow();
					faceRow.ScaleID = empty;
					faceRow.PageID = i / 64;
					faceRow.KeyID = i % 64;
					faceRow.PLUID = 0;
					eCSDataSet.Face.AddFaceRow(faceRow);
				}
				faceListComboBox.SelectedValue = empty;
			}
			catch (Exception)
			{
			}
		}
		delButton.Enabled = eCSDataSet.FaceList.Count > 1;
	}

	private void delButton_Click(object sender, EventArgs e)
	{
		if (faceListComboBox.SelectedIndex == -1)
		{
			return;
		}
		string arg = (string)faceListComboBox.SelectedValue;
		if (eCSDataSet.FaceList.Count > 1 && MessageBox.Show(this, string.Format(Program.GetLang("pw_Delete_0__"), arg), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
		{
			try
			{
				ECSDataSet.FaceListRow faceListRow = eCSDataSet.FaceList.FindByScaleID((string)faceListComboBox.SelectedValue);
				faceListRow.Delete();
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
		delButton.Enabled = eCSDataSet.FaceList.Count > 1;
	}

	private void clearButton_Click(object sender, EventArgs e)
	{
		foreach (ECSDataSet.FaceRow item in eCSDataSet.Face)
		{
			if (item.ScaleID == (string)faceListComboBox.SelectedValue)
			{
				item.PLUID = 0;
			}
		}
		faceTableAdapter.Update(eCSDataSet.Face);
		myPanel.Invalidate();
	}

	private void fontButton_Click(object sender, EventArgs e)
	{
		FontDialog fontDialog = new FontDialog();
		fontDialog.Font = _font;
		if (fontDialog.ShowDialog(this) == DialogResult.OK)
		{
			_font = fontDialog.Font;
			Settings.Default.faceFont = _font;
			myPanel.Invalidate();
		}
	}

	private void autoButton_Click(object sender, EventArgs e)
	{
		int num = 0;
		int num2 = 0;
		int num3 = 0;
		bool flag = false;
		if (eCSDataSet.FaceList.Count >= 2)
		{
			using FaceAutoFilterForm faceAutoFilterForm = new FaceAutoFilterForm();
			DialogResult dialogResult = faceAutoFilterForm.ShowDialog(this);
			if (dialogResult == DialogResult.OK)
			{
				num = faceAutoFilterForm.GetSort;
				num2 = faceAutoFilterForm.GetP1;
				num3 = faceAutoFilterForm.GetP2;
				flag = faceAutoFilterForm.GetP3;
			}
		}
		if (flag)
		{
			foreach (ECSDataSet.FaceRow item in eCSDataSet.Face)
			{
				if (item.ScaleID == (string)faceListComboBox.SelectedValue)
				{
					item.PLUID = 0;
				}
			}
		}
		pluTableAdapter.Fill(eCSDataSet.PLU);
		int num4 = 0;
		foreach (UIDataSet.ScPLU_SectionRow item2 in uIDataSet.ScPLU_Section)
		{
			if (item2.Page == _page)
			{
				num4 += item2.Num_X * item2.Num_Y;
			}
		}
		int[] array = new int[num4];
		int[] array2 = new int[num4];
		num4 = 0;
		int i;
		foreach (UIDataSet.ScPLU_SectionRow item3 in uIDataSet.ScPLU_Section)
		{
			if (item3.Page == _page)
			{
				int num5 = num4;
				i = num4;
				for (num4 += item3.Num_X * item3.Num_Y; i < num4; i++)
				{
					array[i] = item3.Data_Page;
					array2[i] = item3.Data_Offset + i - num5;
				}
			}
		}
		if (num == 4)
		{
			classTableAdapter.Fill(eCSDataSet.Class);
		}
		i = 0;
		foreach (ECSDataSet.PLURow item4 in eCSDataSet.PLU)
		{
			if (i >= num4)
			{
				break;
			}
			switch (num)
			{
			case 1:
				if (item4.PLUID > num3 || item4.PLUID < num2)
				{
					continue;
				}
				break;
			case 2:
				if (item4.Remark > num3 || item4.Remark < num2)
				{
					continue;
				}
				break;
			case 3:
				if (item4.ClassID != num2)
				{
					continue;
				}
				break;
			case 4:
			{
				ECSDataSet.ClassRow classRow = eCSDataSet.Class.FindByClassID(item4.ClassID);
				if (classRow == null || classRow.DeptID != num2)
				{
					continue;
				}
				break;
			}
			}
			ECSDataSet.FaceRow faceRow2 = eCSDataSet.Face.FindByScaleIDKeyIDPageID((string)faceListComboBox.SelectedValue, array2[i], array[i]);
			if (faceRow2 != null)
			{
				faceRow2.PLUID = item4.PLUID;
			}
			else
			{
				ECSDataSet.FaceListRow parentFaceListRowByKF_FaceList_Face = eCSDataSet.FaceList.FindByScaleID((string)faceListComboBox.SelectedValue);
				eCSDataSet.Face.AddFaceRow(parentFaceListRowByKF_FaceList_Face, array2[i], array[i], item4.PLUID);
			}
			i++;
		}
		faceTableAdapter.Update(eCSDataSet.Face);
		myPanel.Invalidate();
	}

	private void saveButton_Click(object sender, EventArgs e)
	{
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.Filter = Program.GetLang("pw_JPEGFile___jpg____jpg_AllFile_________");
		saveFileDialog.AddExtension = true;
		if (saveFileDialog.ShowDialog(this) == DialogResult.OK)
		{
			Bitmap image = DrawFace_bmp();
			SaveJPGWithCompressionSetting(image, saveFileDialog.FileName, 100L);
		}
	}

	private void idCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		myPanel.Invalidate();
	}

	private void toolStripButton1_Click(object sender, EventArgs e)
	{
		Validate();
		try
		{
			labelItemBindingSource.EndEdit();
			int num = -1;
			int num2 = -1;
			foreach (DataRowView item in labelItemBindingSource)
			{
				ECSDataSet.LabelItemRow labelItemRow = (ECSDataSet.LabelItemRow)item.Row;
				if (labelItemRow.SubID > num)
				{
					num = labelItemRow.SubID;
				}
			}
			PropertyDescriptorCollection itemProperties = labelItemBindingSource.CurrencyManager.GetItemProperties();
			int num3 = num + 1;
			if (num3 > Settings.Default.maxLabelItemID)
			{
				int i;
				for (i = 0; i <= Settings.Default.maxLabelItemID; i++)
				{
					num2 = labelItemBindingSource.Find(itemProperties["SubID"], i);
					if (num2 == -1)
					{
						num3 = i;
						break;
					}
				}
				if (i > Settings.Default.maxLabelItemID)
				{
					return;
				}
			}
			labelItemBindingSource.AddNew();
			GetCurrentItemRow().SubID = num3;
			fontComboBox.SelectedIndex = 0;
			labelItemBindingSource.EndEdit();
			num2 = labelItemBindingSource.Find(itemProperties["SubID"], num3);
			if (num2 != -1)
			{
				labelItemBindingSource.Position = num2;
			}
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			labelItemBindingSource.CancelEdit();
		}
	}

	private void cloneToolStripButton_Click(object sender, EventArgs e)
	{
		Validate();
		try
		{
			labelItemBindingSource.EndEdit();
			int num = -1;
			int num2 = -1;
			foreach (DataRowView item in labelItemBindingSource)
			{
				ECSDataSet.LabelItemRow labelItemRow = (ECSDataSet.LabelItemRow)item.Row;
				if (labelItemRow.SubID > num)
				{
					num = labelItemRow.SubID;
				}
			}
			PropertyDescriptorCollection itemProperties = labelItemBindingSource.CurrencyManager.GetItemProperties();
			int num3 = num + 1;
			if (num3 > Settings.Default.maxLabelItemID)
			{
				int i;
				for (i = 0; i <= Settings.Default.maxLabelItemID; i++)
				{
					num2 = labelItemBindingSource.Find(itemProperties["SubID"], i);
					if (num2 == -1)
					{
						num3 = i;
						break;
					}
				}
				if (i > Settings.Default.maxLabelItemID)
				{
					return;
				}
			}
			ECSDataSet.LabelItemRow currentItemRow = GetCurrentItemRow();
			if (currentItemRow != null)
			{
				object[] itemArray = currentItemRow.ItemArray;
				itemArray[1] = num3;
				labelItemBindingSource.AddNew();
				GetCurrentItemRow().ItemArray = itemArray;
				fontComboBox.SelectedIndex = 0;
				labelItemBindingSource.EndEdit();
				num2 = labelItemBindingSource.Find(itemProperties["SubID"], num3);
				if (num2 != -1)
				{
					labelItemBindingSource.Position = num2;
				}
			}
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			labelItemBindingSource.CancelEdit();
		}
	}

	private void faceListBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
	{
		if (e.BindingCompleteContext == BindingCompleteContext.DataSourceUpdate)
		{
			BindingSource bindingSource = sender as BindingSource;
			try
			{
				bindingSource.EndEdit();
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				bindingSource.CancelEdit();
			}
		}
	}

	private void P5_ZeroBack_x_radioButton_CheckChanged(object sender, EventArgs e)
	{
		if (P5_ZeroBack_1_radioButton.Checked)
		{
			ctSC.MG_ZeroBack = 1;
		}
		else if (P5_ZeroBack_2_radioButton.Checked)
		{
			ctSC.MG_ZeroBack = 2;
		}
		else if (P5_ZeroBack_3_radioButton.Checked)
		{
			ctSC.MG_ZeroBack = 3;
		}
		else if (P5_ZeroBack_4_radioButton.Checked)
		{
			ctSC.MG_ZeroBack = 4;
		}
		else if (P5_Unconfirmed_0_radioButton.Checked)
		{
			ctSC.MG_ZeroBack = 0;
		}
	}

	private void P1_Part6_xxxxDecimal_NumericUpDown_Visible()
	{
		NumericUpDown p1_Part6_MoneyDecimal_NumericUpDown = P1_Part6_MoneyDecimal_NumericUpDown;
		Label p1_Part6_MoneyDecimal_V2_Label = P1_Part6_MoneyDecimal_V2_Label;
		NumericUpDown p1_Part6_WeightDecimal_NumericUpDown = P1_Part6_WeightDecimal_NumericUpDown;
		Label p1_Part6_WeightDecimal_V2_Label = P1_Part6_WeightDecimal_V2_Label;
		NumericUpDown p1_Part6_PcsDecimal_NumericUpDown = P1_Part6_PcsDecimal_NumericUpDown;
		bool flag = (P1_Part6_PcsDecimal_V2_Label.Visible = true);
		bool flag3 = (p1_Part6_PcsDecimal_NumericUpDown.Enabled = flag);
		bool flag5 = (p1_Part6_WeightDecimal_V2_Label.Visible = flag3);
		bool flag7 = (p1_Part6_WeightDecimal_NumericUpDown.Enabled = flag5);
		bool enabled = (p1_Part6_MoneyDecimal_V2_Label.Visible = flag7);
		p1_Part6_MoneyDecimal_NumericUpDown.Enabled = enabled;
		ctSC.Barcode_CR_Decimal_Weight_Use = (ctSC.Barcode_CR_Decimal_Pcs_Use = (ctSC.Barcode_CR_Decimal_Money_Use = true));
		if (!P1_Part4_groupBox.Visible)
		{
			if (!P1_P3Amount_radioButton.Checked)
			{
				NumericUpDown p1_Part6_WeightDecimal_NumericUpDown2 = P1_Part6_WeightDecimal_NumericUpDown;
				bool enabled2 = (P1_Part6_PcsDecimal_NumericUpDown.Enabled = false);
				p1_Part6_WeightDecimal_NumericUpDown2.Enabled = enabled2;
				ctSC.Barcode_CR_Decimal_Weight_Use = (ctSC.Barcode_CR_Decimal_Pcs_Use = false);
			}
			if (!P1_P3Total_radioButton.Checked)
			{
				P1_Part6_MoneyDecimal_NumericUpDown.Enabled = false;
				ctSC.Barcode_CR_Decimal_Money_Use = false;
			}
		}
	}

	private void P1_Part6_xxxxDecimal_NumericUpDown_ValueChanged(object sender, EventArgs e)
	{
		ctSC.Barcode_CR_Decimal_Money = (int)P1_Part6_MoneyDecimal_NumericUpDown.Value;
		ctSC.Barcode_CR_Decimal_Weight = (int)P1_Part6_WeightDecimal_NumericUpDown.Value;
		ctSC.Barcode_CR_Decimal_Pcs = (int)P1_Part6_PcsDecimal_NumericUpDown.Value;
		P1_Part6_MoneyDecimal_V2_Label.Text = "1234";
		P1_Part6_MoneyDecimal_V1_Label.Text = P2_Prefix_textBox.Text + 1234.0 / (double)Program.Power10(ctSC.Barcode_CR_Decimal_Money) + P2_Suffix_textBox.Text;
		P1_Part6_WeightDecimal_V2_Label.Text = "255";
		P1_Part6_WeightDecimal_V1_Label.Text = 255.0 / (double)Program.Power10(ctSC.Barcode_CR_Decimal_Weight) + P2_PrintUnit_addWeight_label.Text;
		P1_Part6_PcsDecimal_V1_Label.Text = "1" + P2_PrintUnit_addPcs_label.Text;
		P1_Part6_PcsDecimal_V2_Label.Text = Program.Power10(ctSC.Barcode_CR_Decimal_Pcs).ToString();
	}

	private void printDocument_PrintPage(object sender, PrintPageEventArgs e)
	{
		Bitmap bitmap = DrawFace_bmp();
		PrintDocument printDocument = sender as PrintDocument;
		e.Graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
		if (printDocument.DefaultPageSettings.PaperSize.Width > printDocument.DefaultPageSettings.PaperSize.Height != bitmap.Width > bitmap.Height)
		{
			bitmap.RotateFlip(RotateFlipType.Rotate90FlipNone);
		}
		int num = (int)((float)e.PageSettings.PaperSize.Width - (float)(bitmap.Width * 100) / bitmap.HorizontalResolution) / 2;
		int num2 = (int)((float)e.PageSettings.PaperSize.Height - (float)(bitmap.Height * 100) / bitmap.VerticalResolution) / 2;
		if (num < 0)
		{
			num = 0;
		}
		if (num2 < 0)
		{
			num2 = 0;
		}
		e.Graphics.DrawImage(bitmap, new Point(num, num2));
	}

	private void Print_Button_Click(object sender, EventArgs e)
	{
		using PrintDocument printDocument = new PrintDocument();
		printDocument.PrintPage += printDocument_PrintPage;
		PrintDialog printDialog = new PrintDialog();
		printDialog.Document = printDocument;
		if (printDialog.ShowDialog() == DialogResult.OK)
		{
			try
			{
				printDocument.Print();
				return;
			}
			catch (Exception ex)
			{
				MessageBox.Show(ex.Message, Program.GetLang("pw_Error_OperationFailed"), MessageBoxButtons.OK, MessageBoxIcon.Hand);
				printDocument.PrintController.OnEndPrint(printDocument, new PrintEventArgs());
				return;
			}
		}
	}

	private void P7_ItemValue(object sender, EventArgs e)
	{
		Label qRVersion_Label = QRVersion_Label;
		Label qRSize_Label = QRSize_Label;
		NumericUpDown p1_P7_QRVersion_NumericUpDown = P1_P7_QRVersion_NumericUpDown;
		CheckBox p1_P7_NoLastEnter_CheckBox = P1_P7_NoLastEnter_CheckBox;
		bool flag = (P1_P7_SingleQR_CheckBox.Enabled = P1_P7_SumQR_RadioButton.Checked);
		bool flag3 = (p1_P7_NoLastEnter_CheckBox.Enabled = flag);
		bool flag5 = (p1_P7_QRVersion_NumericUpDown.Enabled = flag3);
		bool enabled = (qRSize_Label.Enabled = flag5);
		qRVersion_Label.Enabled = enabled;
		ctSC.Barcode_CR_QR = P1_P7_SumQR_RadioButton.Checked;
		ctSC.Barcode_CR_QR_Para = (P1_P7_SingleQR_CheckBox.Checked ? 1 : 0) | (P1_P7_NoLastEnter_CheckBox.Checked ? 2 : 0);
		P1_TypeX_radioButton_CheckedChanged(null, null);
	}

	private void BarcodeStringDebug()
	{
		char[] barcode_Single = GetBarcode_Single();
		if (ctSC.Barcode_CR_QR)
		{
			if ((ctSC.Barcode_CR_QR_Para & 1) == 0)
			{
				barcode_CashRegister_Info_Label.Text = new string(barcode_Single);
			}
			else
			{
				barcode_CashRegister_Info_Label.Text = GetBarcode_SumQR(barcode_Single);
			}
		}
		else
		{
			barcode_CashRegister_Info_Label.Text = new string(barcode_Single);
		}
		if (ctSC.Mode_Prepack && !ctSC.Mode_OneItemOnly)
		{
			if (ctSC.Barcode_CR_QR)
			{
				if ((ctSC.Barcode_CR_QR_Para & 1) == 0)
				{
					barcode_CashRegister_Info_Label.Text = barcode_CashRegister_Info_Label.Text + "|" + GetBarcode_SumQR(barcode_Single);
				}
				else
				{
					barcode_CashRegister_Info_Label.Text += "|";
				}
			}
			else
			{
				barcode_CashRegister_Info_Label.Text = barcode_CashRegister_Info_Label.Text + "|" + GetBarcode_SumEAN(barcode_Single);
			}
		}
		InfoResize();
	}

	private void button1_Click(object sender, EventArgs e)
	{
		BarcodeStringDebug();
	}

	private void P1_P7_QRVersion_NumericUpDown_ValueChanged(object sender, EventArgs e)
	{
		ctSC.Barcode_CR_QR_Version = (int)P1_P7_QRVersion_NumericUpDown.Value;
		decimal num = 6.5m + 1.5m * (decimal)ctSC.Barcode_CR_QR_Version;
		QRSize_Label.Text = "≥" + num + "mm * " + num + "mm";
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		this.components = new System.ComponentModel.Container();
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.WizardForm));
		System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle = new System.Windows.Forms.DataGridViewCellStyle();
		this.pt_Left_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.pt_LeftUD_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.pt_LeftUDU_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.labelDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn5 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.labelBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.eCSDataSet = new ECS.ECSDataSet();
		this.labelBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.PPwidthNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.PPheightNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.PPheightMMNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.PPwidthMMNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.heightLabel = new System.Windows.Forms.Label();
		this.widthLabel = new System.Windows.Forms.Label();
		this.pt_LeftUDD_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.labelitemDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Display = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.labelItemBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.labelItemBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.toolStripButton2 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton1 = new System.Windows.Forms.ToolStripButton();
		this.cloneToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.panel5 = new System.Windows.Forms.Panel();
		this.alignButton = new System.Windows.Forms.Button();
		this.flagButton = new System.Windows.Forms.Button();
		this.printLabel = new System.Windows.Forms.Label();
		this.printComboBox = new System.Windows.Forms.ComboBox();
		this.labelItemPrintBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uIDataSet = new ECS.UIDataSet();
		this.alignComboBox = new System.Windows.Forms.ComboBox();
		this.labelItemAlignBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.alignLabel = new System.Windows.Forms.Label();
		this.angleComboBox = new System.Windows.Forms.ComboBox();
		this.labelItemAngleBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.fontLabel = new System.Windows.Forms.Label();
		this.fontComboBox = new System.Windows.Forms.ComboBox();
		this.labelItemFontBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.angleLabel = new System.Windows.Forms.Label();
		this.pt_Mid_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.PT_Rotate_checkBox = new System.Windows.Forms.CheckBox();
		this.PT_EditClone_Button = new System.Windows.Forms.Button();
		this.PT_Back_Button = new System.Windows.Forms.Button();
		this.panel1 = new System.Windows.Forms.Panel();
		this.subPanel = new ECS.MyPanel();
		this.pt_Mid_StatusStrip = new System.Windows.Forms.StatusStrip();
		this.pt_Mid_Height_TSSLabel = new System.Windows.Forms.ToolStripStatusLabel();
		this.pt_Mid_NULL_TSSLabel = new System.Windows.Forms.ToolStripStatusLabel();
		this.pt_Mid_Width_TSSLabel = new System.Windows.Forms.ToolStripStatusLabel();
		this.pt_Right_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.pt_Sample_PictureBox = new System.Windows.Forms.PictureBox();
		this.tp_Info_TableLayoutPanel = new System.Windows.Forms.TableLayoutPanel();
		this.pt_InfoTextSample_Panel = new System.Windows.Forms.Panel();
		this.pt_InfoTextSample_TextBox = new System.Windows.Forms.TextBox();
		this.pt_InfoTextSample_Label = new System.Windows.Forms.Label();
		this.pt_Picture_Panel = new System.Windows.Forms.Panel();
		this.pt_Picture_ClearButton = new System.Windows.Forms.Button();
		this.pt_Picture_SelectButton = new System.Windows.Forms.Button();
		this.pt_Picture_PictureBox = new System.Windows.Forms.PictureBox();
		this.pt_Picture_ComboBox = new System.Windows.Forms.ComboBox();
		this.pt_Picture_Label = new System.Windows.Forms.Label();
		this.splitContainer = new System.Windows.Forms.SplitContainer();
		this.myPanel = new ECS.MyPanel();
		this.Print_Button = new System.Windows.Forms.Button();
		this.delButton = new System.Windows.Forms.Button();
		this.addButton = new System.Windows.Forms.Button();
		this.autoButton = new System.Windows.Forms.Button();
		this.clearButton = new System.Windows.Forms.Button();
		this.idCheckBox = new System.Windows.Forms.CheckBox();
		this.faceLabel = new System.Windows.Forms.Label();
		this.faceComboBox = new System.Windows.Forms.ComboBox();
		this.faceListBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.scPLUP_bindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.scaleID_Label = new System.Windows.Forms.Label();
		this.layoutLabel = new System.Windows.Forms.Label();
		this.faceListComboBox = new System.Windows.Forms.ComboBox();
		this.layoutComboBox = new System.Windows.Forms.ComboBox();
		this.scPLUL_bindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.fontButton = new System.Windows.Forms.Button();
		this.saveButton = new System.Windows.Forms.Button();
		this.pt_Top_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.pt_Main_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.Main_panel = new System.Windows.Forms.Panel();
		this.tableLayoutPanel = new System.Windows.Forms.TableLayoutPanel();
		this.TE_label = new System.Windows.Forms.Label();
		this.pt_Panel = new System.Windows.Forms.Panel();
		this.Header_panel = new System.Windows.Forms.Panel();
		this.NextDisable_Label = new System.Windows.Forms.Label();
		this.Ethernet_button = new System.Windows.Forms.Button();
		this.TMSFile_button = new System.Windows.Forms.Button();
		this.Next_button = new System.Windows.Forms.Button();
		this.Previous_button = new System.Windows.Forms.Button();
		this.mode_Panel = new System.Windows.Forms.Panel();
		this.panel7 = new System.Windows.Forms.Panel();
		this.Mode_Gray_label = new System.Windows.Forms.Label();
		this.Mode_GapPapper_Panel = new System.Windows.Forms.Panel();
		this.Mode_GapPaper0_RadioButton = new System.Windows.Forms.RadioButton();
		this.Mode_GapPaper60x30_RadioButton = new System.Windows.Forms.RadioButton();
		this.Mode_GapPaper30x40_RadioButton = new System.Windows.Forms.RadioButton();
		this.Mode_GapPaper40x30_RadioButton = new System.Windows.Forms.RadioButton();
		this.Mode_GapPaper60x40_RadioButton = new System.Windows.Forms.RadioButton();
		this.Mode_PlainPapper_Panel = new System.Windows.Forms.Panel();
		this.Mode_PlainPaper0_RadioButton = new System.Windows.Forms.RadioButton();
		this.Mode_PlainPaper40_RadioButton = new System.Windows.Forms.RadioButton();
		this.Mode_PlainPaper60_RadioButton = new System.Windows.Forms.RadioButton();
		this.Mode_PlainPaper57_RadioButton = new System.Windows.Forms.RadioButton();
		this.Mode_PlainPapper_RadioButton = new System.Windows.Forms.RadioButton();
		this.Mode_GapPapper_RadioButton = new System.Windows.Forms.RadioButton();
		this.Mode_Gray_numericUpDown = new System.Windows.Forms.NumericUpDown();
		this.Mode_LabelPrint_RadioButton = new System.Windows.Forms.RadioButton();
		this.Mode_PrintDirect_checkBox = new System.Windows.Forms.CheckBox();
		this.Mode_CashRegister_RadioButton = new System.Windows.Forms.RadioButton();
		this.Mode_ScanInternalBarcode_checkBox = new System.Windows.Forms.CheckBox();
		this.Mode_OneItemOnly_checkBox = new System.Windows.Forms.CheckBox();
		this.barcode_panel = new System.Windows.Forms.Panel();
		this.tableLayoutPanel1 = new System.Windows.Forms.TableLayoutPanel();
		this.barcode_Special_Panel = new System.Windows.Forms.Panel();
		this.barcode_Special_CheckDigit_CheckBox = new System.Windows.Forms.CheckBox();
		this.barcode_Special_Type_ComboBox = new System.Windows.Forms.ComboBox();
		this.barcodeFormatBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.barcode_Special_Type_Label = new System.Windows.Forms.Label();
		this.barcode_Special_PLUInfo_RadioButton = new System.Windows.Forms.RadioButton();
		this.barcode_Special_Constant_TextBox = new System.Windows.Forms.TextBox();
		this.barcode_Special_PLUInfo_ComboBox = new System.Windows.Forms.ComboBox();
		this.barcode_Special_Constant_RadioButton = new System.Windows.Forms.RadioButton();
		this.barcode_CashRegister_RadioButton = new System.Windows.Forms.RadioButton();
		this.barcode_CashRegister_Panel = new System.Windows.Forms.Panel();
		this.P1_Part7_groupBox = new System.Windows.Forms.GroupBox();
		this.P1_P7_QRVersion_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.QRSize_Label = new System.Windows.Forms.Label();
		this.QRVersion_Label = new System.Windows.Forms.Label();
		this.P1_P7_NoLastEnter_CheckBox = new System.Windows.Forms.CheckBox();
		this.P1_P7_SingleQR_CheckBox = new System.Windows.Forms.CheckBox();
		this.P1_P7_SumQR_RadioButton = new System.Windows.Forms.RadioButton();
		this.P1_P7_SumEAN_RadioButton = new System.Windows.Forms.RadioButton();
		this.P1_Part6_groupBox = new System.Windows.Forms.GroupBox();
		this.P1_Part6_PcsDecimal_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.P1_Part6_PcsDecimal_Label = new System.Windows.Forms.Label();
		this.P1_Part6_MoneyDecimal_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.P1_Part6_MoneyDecimal_Label = new System.Windows.Forms.Label();
		this.P1_Part6_WeightDecimal_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.P1_Part6_WeightDecimal_Label = new System.Windows.Forms.Label();
		this.P1_Part6_PcsDecimal_Ve_Label = new System.Windows.Forms.Label();
		this.P1_Part6_WeightDecimal_Ve_Label = new System.Windows.Forms.Label();
		this.P1_Part6_MoneyDecimal_Ve_Label = new System.Windows.Forms.Label();
		this.P1_Part6_PcsDecimal_V2_Label = new System.Windows.Forms.Label();
		this.P1_Part6_WeightDecimal_V2_Label = new System.Windows.Forms.Label();
		this.P1_Part6_MoneyDecimal_V2_Label = new System.Windows.Forms.Label();
		this.P1_Part6_PcsDecimal_V1_Label = new System.Windows.Forms.Label();
		this.P1_Part6_WeightDecimal_V1_Label = new System.Windows.Forms.Label();
		this.P1_Part6_MoneyDecimal_V1_Label = new System.Windows.Forms.Label();
		this.barcode_CashRegister_Info_Panel = new System.Windows.Forms.Panel();
		this.barcode_CashRegister_Info_Label = new System.Windows.Forms.Label();
		this.P1_Type_groupBox = new System.Windows.Forms.GroupBox();
		this.P1_Type15651_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_label2 = new System.Windows.Forms.Label();
		this.P1_Type16551_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_Type2551_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_Type1561_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_Type2641_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_Type1651_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_Type25551_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_Type2461_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_label1 = new System.Windows.Forms.Label();
		this.P1_Type26451_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_Type24651_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_Part3_4Sum_groupBox = new System.Windows.Forms.GroupBox();
		this.P1_P3_4TotalPcs_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_P3_4TotalWeight_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_Part1_2Sum_groupBox = new System.Windows.Forms.GroupBox();
		this.P1_Part1_2Sum_UseItem_CheckBox = new System.Windows.Forms.CheckBox();
		this.P1_P1_2SumFlag_numericUpDown = new System.Windows.Forms.NumericUpDown();
		this.P1_P1_2_label = new System.Windows.Forms.Label();
		this.P1_Part2_groupBox = new System.Windows.Forms.GroupBox();
		this.P1_P2Const_numericUpDown = new System.Windows.Forms.NumericUpDown();
		this.P1_P2Const_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_P2PLUNumber_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_P2ItemCode_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_Part5_groupBox = new System.Windows.Forms.GroupBox();
		this.P1_Check_C0_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_Check_NS_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_Check_S_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_Part1_groupBox = new System.Windows.Forms.GroupBox();
		this.P1_P1_ItemFlag_numericUpDown = new System.Windows.Forms.NumericUpDown();
		this.P1_P1_label = new System.Windows.Forms.Label();
		this.P1_Part3_groupBox = new System.Windows.Forms.GroupBox();
		this.P1_P3Total_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_P3Amount_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_Part4_groupBox = new System.Windows.Forms.GroupBox();
		this.P1_P4Total_radioButton = new System.Windows.Forms.RadioButton();
		this.P1_P4Amount_radioButton = new System.Windows.Forms.RadioButton();
		this.barcode_Special_RadioButton = new System.Windows.Forms.RadioButton();
		this.barcode_ManualEdit_Panel = new System.Windows.Forms.Panel();
		this.Group_Label = new System.Windows.Forms.Label();
		this.BarSub_TableLayoutPanel = new System.Windows.Forms.TableLayoutPanel();
		this.view_subpage_panel = new System.Windows.Forms.Panel();
		this.label4 = new System.Windows.Forms.Label();
		this.label5 = new System.Windows.Forms.Label();
		this.label6 = new System.Windows.Forms.Label();
		this.Info_Panel = new System.Windows.Forms.Panel();
		this.Version_Error_Label = new System.Windows.Forms.Label();
		this.TE2_label = new System.Windows.Forms.Label();
		this.BarNum_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.barcode_ManualEdit_CheckDigit_CheckBox = new System.Windows.Forms.CheckBox();
		this.TChar_TextBox = new System.Windows.Forms.TextBox();
		this.barcode_ManualEdit_BType_ComboBox = new System.Windows.Forms.ComboBox();
		this.barcodeFormat2BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.barcode_ManualEdit_Type_Label = new System.Windows.Forms.Label();
		this.barcode_ManualEdit_RadioButton = new System.Windows.Forms.RadioButton();
		this.device_Panel = new System.Windows.Forms.Panel();
		this.Device_F_Label = new System.Windows.Forms.Label();
		this.Device_F_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_A17_Label = new System.Windows.Forms.Label();
		this.Device_D_Label = new System.Windows.Forms.Label();
		this.Device_E_Label = new System.Windows.Forms.Label();
		this.Device_A08_Label = new System.Windows.Forms.Label();
		this.Device_B_Label = new System.Windows.Forms.Label();
		this.Device_A12_Label = new System.Windows.Forms.Label();
		this.Device_C11_Label = new System.Windows.Forms.Label();
		this.Device_C15_Label = new System.Windows.Forms.Label();
		this.devicePictureBox = new System.Windows.Forms.PictureBox();
		this.Device_E_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_B_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_D_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_C_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_A_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_Cxx_Display_Panel = new System.Windows.Forms.Panel();
		this.Device_Cxx_5w_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_Cxx_4w_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_Axx_Display_Panel = new System.Windows.Forms.Panel();
		this.Device_Axx_np_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_Axx_5w_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_Axx_4w_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_Cxx_Panel = new System.Windows.Forms.Panel();
		this.Device_C11_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_C15_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_Axx_Panel = new System.Windows.Forms.Panel();
		this.Device_A17_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_A15_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_A08_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_A12_RadioButton = new System.Windows.Forms.RadioButton();
		this.Device_A15_Label = new System.Windows.Forms.Label();
		this.manage_panel = new System.Windows.Forms.Panel();
		this.MG_CustomRight_RadioButton = new System.Windows.Forms.RadioButton();
		this.MG_NoRight_RadioButton = new System.Windows.Forms.RadioButton();
		this.MG_LimitedRight_RadioButton = new System.Windows.Forms.RadioButton();
		this.MG_FullRight_RadioButton = new System.Windows.Forms.RadioButton();
		this.mg_Detail_Panel = new System.Windows.Forms.Panel();
		this.P5_ZeroBack_groupBox = new System.Windows.Forms.GroupBox();
		this.P5_ZeroBack_3_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_ZeroBack_1_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_ZeroBack_0_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_ZeroBack_4_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_ZeroBack_2_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_Unconfirmed_groupBox = new System.Windows.Forms.GroupBox();
		this.P5_Unconfirmed_1_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_Unconfirmed_0_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_Unconfirmed_2_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_VBuffer_groupBox = new System.Windows.Forms.GroupBox();
		this.P5_VBuffer_3_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_VBuffer_0_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_VBuffer_1_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_VBuffer_4_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_VBuffer_2_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_TotalPrice_groupBox = new System.Windows.Forms.GroupBox();
		this.P5_TotalPrice_Allowed_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_TotalPrice_Forbidden_radioButton = new System.Windows.Forms.RadioButton();
		this.mg_AdminIC_groupBox = new System.Windows.Forms.GroupBox();
		this.BuyBack_CheckBox = new System.Windows.Forms.CheckBox();
		this.FProgPrice_CheckBox = new System.Windows.Forms.CheckBox();
		this.TSaleWT_CheckBox = new System.Windows.Forms.CheckBox();
		this.TSaleCT_CheckBox = new System.Windows.Forms.CheckBox();
		this.Preprint_CheckBox = new System.Windows.Forms.CheckBox();
		this.Reprint_CheckBox = new System.Windows.Forms.CheckBox();
		this.HangupRead_CheckBox = new System.Windows.Forms.CheckBox();
		this.HangupWrite_CheckBox = new System.Windows.Forms.CheckBox();
		this.Drawer_CheckBox = new System.Windows.Forms.CheckBox();
		this.Amend_CheckBox = new System.Windows.Forms.CheckBox();
		this.ItemQuit_CheckBox = new System.Windows.Forms.CheckBox();
		this.IllegalReboot_CheckBox = new System.Windows.Forms.CheckBox();
		this.P5_UnitPrice_groupBox = new System.Windows.Forms.GroupBox();
		this.P5_UnitPrice_Allowed_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_UnitPrice_Forbidden_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_Other_groupBox = new System.Windows.Forms.GroupBox();
		this.P5_Other_USBboot_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_Other_scPLUFProg_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_Other_PLUFProg_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_Other_SpecFProg_checkBox = new System.Windows.Forms.CheckBox();
		this.mg_Password_groupBox = new System.Windows.Forms.GroupBox();
		this.P5_AM_PriceFProg_textBox = new System.Windows.Forms.TextBox();
		this.P5_AM_Drawer_textBox = new System.Windows.Forms.TextBox();
		this.P5_AM_Account_textBox = new System.Windows.Forms.TextBox();
		this.P5_AM_Prog_textBox = new System.Windows.Forms.TextBox();
		this.P5_AM_Sale_textBox = new System.Windows.Forms.TextBox();
		this.P5_AM_Admin_textBox = new System.Windows.Forms.TextBox();
		this.P5_AM_PriceFProg_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_AM_Drawer_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_AM_Account_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_AM_Prog_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_AM_Admin_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_AM_Sale_checkBox = new System.Windows.Forms.CheckBox();
		this.opconfig_panel = new System.Windows.Forms.Panel();
		this.P5_ZeroReturn_groupBox = new System.Windows.Forms.GroupBox();
		this.P5_ZeroReturn_0_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_ZeroReturn_4_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_ZeroReturn_3_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_BuyBack_groupBox = new System.Windows.Forms.GroupBox();
		this.panel18 = new System.Windows.Forms.Panel();
		this.P5_BuyBack_A2_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_BuyBack_1_Label = new System.Windows.Forms.Label();
		this.P5_BuyBack_A32_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_BuyBack_A64_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_BuyBack_A256_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_BuyBack_A128_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_BuyBack_A1_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_BuyBack_A16_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_BuyBack_A8_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_BuyBack_A4_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_PriceFProg_groupBox = new System.Windows.Forms.GroupBox();
		this.P5_PriceFProg_1_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_PriceFProg_4_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_PriceFProg_2_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_PriceFProg_0_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_PriceFProg_3_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_Payments_groupBox = new System.Windows.Forms.GroupBox();
		this.P5_Payments_A32_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_Payments_A16_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_Payments_A8_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_Payments_A4_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_Payments_A2_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_Payments_A1_checkBox = new System.Windows.Forms.CheckBox();
		this.P5_Hangup_groupBox = new System.Windows.Forms.GroupBox();
		this.P5_Hangup_1_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_Hangup_0_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_Hangup_3_radioButton = new System.Windows.Forms.RadioButton();
		this.P5_Hangup_2_radioButton = new System.Windows.Forms.RadioButton();
		this.unit_panel = new System.Windows.Forms.Panel();
		this.P2_UnitSetting_groupBox = new System.Windows.Forms.GroupBox();
		this.P2_PrintUnit_Money_label = new System.Windows.Forms.Label();
		this.P2_PrintUnit_UPricePcs_label = new System.Windows.Forms.Label();
		this.P2_PrintUnit_UPriceWeight_label = new System.Windows.Forms.Label();
		this.P2_PrintUnit_Pcs_label = new System.Windows.Forms.Label();
		this.P2_PrintUnit_tPcs_label = new System.Windows.Forms.Label();
		this.P2_PrintUnit_addPcs_label = new System.Windows.Forms.Label();
		this.P2_PrintUnit_addWeight_label = new System.Windows.Forms.Label();
		this.P2_PrintUnit_tWeight_label = new System.Windows.Forms.Label();
		this.P2_PrintUnit_Weight_label = new System.Windows.Forms.Label();
		this.P2_PrintUnit_Money_checkbox = new System.Windows.Forms.CheckBox();
		this.P2_PrintUnit_UPrice_checkbox = new System.Windows.Forms.CheckBox();
		this.P2_PrintUnit_Amount_checkbox = new System.Windows.Forms.CheckBox();
		this.P2_Suffix_textBox = new System.Windows.Forms.TextBox();
		this.P2_Prefix_textBox = new System.Windows.Forms.TextBox();
		this.P2_Suffix_label = new System.Windows.Forms.Label();
		this.P2_Money_label = new System.Windows.Forms.Label();
		this.P2_Prefix_label = new System.Windows.Forms.Label();
		this.P4_UpdateSoftware_button = new System.Windows.Forms.Button();
		this.P4_TotalRounding_groupBox = new System.Windows.Forms.GroupBox();
		this.P4_TotalRounding0_S0_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_TotalRounding3_S10_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_TotalRounding2_S1_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_TotalRounding4_S2_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_TotalRounding1_S9_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_ItemRounding_groupBox = new System.Windows.Forms.GroupBox();
		this.P4_ItemRounding0_S0_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_ItemRounding3_S10_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_ItemRounding2_S1_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_ItemRounding1_S9_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_ItemRounding4_S2_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_UPriceRadixPoint_groupBox = new System.Windows.Forms.GroupBox();
		this.P4_UPriceRadixPoint5_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_UPriceRadixPoint4_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_UPriceRadixPoint3_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_UPriceRadixPoint2_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_UPriceRadixPoint0_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_UPriceRadixPoint1_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_TotalRadixPoint_groupBox = new System.Windows.Forms.GroupBox();
		this.P4_TotalRadixPoint5_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_TotalRadixPoint3_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_TotalRadixPoint4_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_TotalRadixPoint2_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_TotalRadixPoint0_radioButton = new System.Windows.Forms.RadioButton();
		this.P4_TotalRadixPoint1_radioButton = new System.Windows.Forms.RadioButton();
		this.w5th_panel = new System.Windows.Forms.Panel();
		this.P3_noPLUinfo_groupBox = new System.Windows.Forms.GroupBox();
		this.P3_2_panel = new System.Windows.Forms.Panel();
		this.P3_Idleinfo_Source3_textBox = new System.Windows.Forms.TextBox();
		this.P3_label4 = new System.Windows.Forms.Label();
		this.P3_Idleinfo_Source0_radioButton = new System.Windows.Forms.RadioButton();
		this.P3_Idleinfo_Source1_radioButton = new System.Windows.Forms.RadioButton();
		this.P3_Idleinfo_Source2_radioButton = new System.Windows.Forms.RadioButton();
		this.P3_Idleinfo_Source3_radioButton = new System.Windows.Forms.RadioButton();
		this.panel6 = new System.Windows.Forms.Panel();
		this.P3_label5 = new System.Windows.Forms.Label();
		this.P3_Accedinfo_Source2_radioButton = new System.Windows.Forms.RadioButton();
		this.P3_Accedinfo_Source0_radioButton = new System.Windows.Forms.RadioButton();
		this.P3_Accedinfo_Source1_radioButton = new System.Windows.Forms.RadioButton();
		this.P3_1_panel = new System.Windows.Forms.Panel();
		this.P3_label3 = new System.Windows.Forms.Label();
		this.P3_noPLUinfo_Font0_radioButton = new System.Windows.Forms.RadioButton();
		this.P3_noPLUinfo_Font1_radioButton = new System.Windows.Forms.RadioButton();
		this.P3_noPLUinfo_Font2_radioButton = new System.Windows.Forms.RadioButton();
		this.P3_noPLUinfo_Font3_radioButton = new System.Windows.Forms.RadioButton();
		this.P3_PLUinfo_groupBox = new System.Windows.Forms.GroupBox();
		this.P3_PLUinfo_S2_comboBox = new System.Windows.Forms.ComboBox();
		this.P3_PLUinfo_S1_comboBox = new System.Windows.Forms.ComboBox();
		this.P3_DoubleSource_checkBox = new System.Windows.Forms.CheckBox();
		this.P3_PLUinfo_Font3_radioButton = new System.Windows.Forms.RadioButton();
		this.P3_PLUinfo_Font2_radioButton = new System.Windows.Forms.RadioButton();
		this.P3_PLUinfo_Font1_radioButton = new System.Windows.Forms.RadioButton();
		this.P3_label2 = new System.Windows.Forms.Label();
		this.P3_label1 = new System.Windows.Forms.Label();
		this.P3_PLUinfo_Font0_radioButton = new System.Windows.Forms.RadioButton();
		this.plu_panel = new System.Windows.Forms.Panel();
		this.P7_panel = new System.Windows.Forms.Panel();
		this.pLUDataGridView = new System.Windows.Forms.DataGridView();
		this.pluidDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.validDataGridViewCheckBoxColumn = new System.Windows.Forms.DataGridViewCheckBoxColumn();
		this.nameDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitidDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.unitBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.priceDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.remarkDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.indexDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.ps_ud_DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.pLUPSDateBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.pc_ud_DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.costDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.tareDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.classidDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.classBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.taxtypeDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.pLU_TaxTypeBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.taxtextDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.labelID1DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.labelBindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.barT1DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.barcodeBindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.barF1DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.labelID2DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.labelBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.barT2DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.barcodeBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.barF2DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.bitmapDataGridViewComboBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.bitmapBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.text1DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.text2DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.text3DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.text4DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.text5DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.text6DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.text7DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sspValue1DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sspValue2DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sspValue3DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sspValue4DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.pLUBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorAddNewItem1 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorDeleteItem1 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorID = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorGoto = new System.Windows.Forms.ToolStripButton();
		this.pluDataElement_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.face_panel = new System.Windows.Forms.Panel();
		this.tmsout_panel = new System.Windows.Forms.Panel();
		this.export_ethernet_Label = new System.Windows.Forms.Label();
		this.export_usb_Label = new System.Windows.Forms.Label();
		this.export_ethernet_PictureBox = new System.Windows.Forms.PictureBox();
		this.export_usb_PictureBox = new System.Windows.Forms.PictureBox();
		this.panel12 = new System.Windows.Forms.Panel();
		this.panel13 = new System.Windows.Forms.Panel();
		this.panel14 = new System.Windows.Forms.Panel();
		this.label1 = new System.Windows.Forms.Label();
		this.panel2 = new System.Windows.Forms.Panel();
		this.panel15 = new System.Windows.Forms.Panel();
		this.panel16 = new System.Windows.Forms.Panel();
		this.panel17 = new System.Windows.Forms.Panel();
		this.panel3 = new System.Windows.Forms.Panel();
		this.opMain_Panel = new System.Windows.Forms.Panel();
		this.OpMain_SCP_CheckBox = new System.Windows.Forms.CheckBox();
		this.OpMain_PLU_CheckBox = new System.Windows.Forms.CheckBox();
		this.OpMain_UnitDisplay_CheckBox = new System.Windows.Forms.CheckBox();
		this.OpMain_SaleOperation_CheckBox = new System.Windows.Forms.CheckBox();
		this.OpMain_Management_CheckBox = new System.Windows.Forms.CheckBox();
		this.OpMain_LabelBarcode_CheckBox = new System.Windows.Forms.CheckBox();
		this.versionTip_Label = new System.Windows.Forms.Label();
		this.OpMain_FirstConfig_radioButton = new System.Windows.Forms.RadioButton();
		this.OpMain_TMSout_radioButton = new System.Windows.Forms.RadioButton();
		this.OpMain_WorkData_radioButton = new System.Windows.Forms.RadioButton();
		this.reset_Button = new System.Windows.Forms.Button();
		this.labelItemTableAdapter = new ECS.ECSDataSetTableAdapters.LabelItemTableAdapter();
		this.labelTableAdapter = new ECS.ECSDataSetTableAdapters.LabelTableAdapter();
		this.labelSortBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.labelVersionBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.blink_Timer = new System.Windows.Forms.Timer(this.components);
		this.stringTableAdapter = new ECS.ECSDataSetTableAdapters.StringTableAdapter();
		this.pluTableAdapter = new ECS.ECSDataSetTableAdapters.PLUTableAdapter();
		this.faceTableAdapter = new ECS.ECSDataSetTableAdapters.FaceTableAdapter();
		this.faceListTableAdapter = new ECS.ECSDataSetTableAdapters.FaceListTableAdapter();
		this.classTableAdapter = new ECS.ECSDataSetTableAdapters.ClassTableAdapter();
		this.barcodeTableAdapter = new ECS.ECSDataSetTableAdapters.BarcodeTableAdapter();
		this.P5_BuyBack_A512_checkBox = new System.Windows.Forms.CheckBox();
		System.Windows.Forms.Label label = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label2 = new System.Windows.Forms.Label();
		this.pt_Left_SplitContainer.Panel1.SuspendLayout();
		this.pt_Left_SplitContainer.Panel2.SuspendLayout();
		this.pt_Left_SplitContainer.SuspendLayout();
		this.pt_LeftUD_SplitContainer.Panel1.SuspendLayout();
		this.pt_LeftUD_SplitContainer.Panel2.SuspendLayout();
		this.pt_LeftUD_SplitContainer.SuspendLayout();
		this.pt_LeftUDU_SplitContainer.Panel1.SuspendLayout();
		this.pt_LeftUDU_SplitContainer.Panel2.SuspendLayout();
		this.pt_LeftUDU_SplitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.labelDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelBindingNavigator).BeginInit();
		this.labelBindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.PPwidthNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PPheightNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PPheightMMNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PPwidthMMNumericUpDown).BeginInit();
		this.pt_LeftUDD_SplitContainer.Panel1.SuspendLayout();
		this.pt_LeftUDD_SplitContainer.Panel2.SuspendLayout();
		this.pt_LeftUDD_SplitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.labelitemDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemBindingNavigator).BeginInit();
		this.labelItemBindingNavigator.SuspendLayout();
		this.panel5.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.labelItemPrintBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemAlignBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemAngleBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemFontBindingSource).BeginInit();
		this.pt_Mid_SplitContainer.Panel1.SuspendLayout();
		this.pt_Mid_SplitContainer.Panel2.SuspendLayout();
		this.pt_Mid_SplitContainer.SuspendLayout();
		this.panel1.SuspendLayout();
		this.pt_Mid_StatusStrip.SuspendLayout();
		this.pt_Right_SplitContainer.Panel1.SuspendLayout();
		this.pt_Right_SplitContainer.Panel2.SuspendLayout();
		this.pt_Right_SplitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pt_Sample_PictureBox).BeginInit();
		this.tp_Info_TableLayoutPanel.SuspendLayout();
		this.pt_InfoTextSample_Panel.SuspendLayout();
		this.pt_Picture_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pt_Picture_PictureBox).BeginInit();
		this.splitContainer.Panel1.SuspendLayout();
		this.splitContainer.Panel2.SuspendLayout();
		this.splitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.faceListBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.scPLUP_bindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.scPLUL_bindingSource).BeginInit();
		this.pt_Top_SplitContainer.Panel2.SuspendLayout();
		this.pt_Top_SplitContainer.SuspendLayout();
		this.pt_Main_SplitContainer.Panel1.SuspendLayout();
		this.pt_Main_SplitContainer.Panel2.SuspendLayout();
		this.pt_Main_SplitContainer.SuspendLayout();
		this.Main_panel.SuspendLayout();
		this.tableLayoutPanel.SuspendLayout();
		this.pt_Panel.SuspendLayout();
		this.Header_panel.SuspendLayout();
		this.mode_Panel.SuspendLayout();
		this.panel7.SuspendLayout();
		this.Mode_GapPapper_Panel.SuspendLayout();
		this.Mode_PlainPapper_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.Mode_Gray_numericUpDown).BeginInit();
		this.barcode_panel.SuspendLayout();
		this.tableLayoutPanel1.SuspendLayout();
		this.barcode_Special_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.barcodeFormatBindingSource).BeginInit();
		this.barcode_CashRegister_Panel.SuspendLayout();
		this.P1_Part7_groupBox.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.P1_P7_QRVersion_NumericUpDown).BeginInit();
		this.P1_Part6_groupBox.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.P1_Part6_PcsDecimal_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.P1_Part6_MoneyDecimal_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.P1_Part6_WeightDecimal_NumericUpDown).BeginInit();
		this.barcode_CashRegister_Info_Panel.SuspendLayout();
		this.P1_Type_groupBox.SuspendLayout();
		this.P1_Part3_4Sum_groupBox.SuspendLayout();
		this.P1_Part1_2Sum_groupBox.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.P1_P1_2SumFlag_numericUpDown).BeginInit();
		this.P1_Part2_groupBox.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.P1_P2Const_numericUpDown).BeginInit();
		this.P1_Part5_groupBox.SuspendLayout();
		this.P1_Part1_groupBox.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.P1_P1_ItemFlag_numericUpDown).BeginInit();
		this.P1_Part3_groupBox.SuspendLayout();
		this.P1_Part4_groupBox.SuspendLayout();
		this.barcode_ManualEdit_Panel.SuspendLayout();
		this.BarSub_TableLayoutPanel.SuspendLayout();
		this.view_subpage_panel.SuspendLayout();
		this.Info_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.BarNum_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeFormat2BindingSource).BeginInit();
		this.device_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.devicePictureBox).BeginInit();
		this.Device_Cxx_Display_Panel.SuspendLayout();
		this.Device_Axx_Display_Panel.SuspendLayout();
		this.Device_Cxx_Panel.SuspendLayout();
		this.Device_Axx_Panel.SuspendLayout();
		this.manage_panel.SuspendLayout();
		this.mg_Detail_Panel.SuspendLayout();
		this.P5_ZeroBack_groupBox.SuspendLayout();
		this.P5_Unconfirmed_groupBox.SuspendLayout();
		this.P5_VBuffer_groupBox.SuspendLayout();
		this.P5_TotalPrice_groupBox.SuspendLayout();
		this.mg_AdminIC_groupBox.SuspendLayout();
		this.P5_UnitPrice_groupBox.SuspendLayout();
		this.P5_Other_groupBox.SuspendLayout();
		this.mg_Password_groupBox.SuspendLayout();
		this.opconfig_panel.SuspendLayout();
		this.P5_ZeroReturn_groupBox.SuspendLayout();
		this.P5_BuyBack_groupBox.SuspendLayout();
		this.panel18.SuspendLayout();
		this.P5_PriceFProg_groupBox.SuspendLayout();
		this.P5_Payments_groupBox.SuspendLayout();
		this.P5_Hangup_groupBox.SuspendLayout();
		this.unit_panel.SuspendLayout();
		this.P2_UnitSetting_groupBox.SuspendLayout();
		this.P4_TotalRounding_groupBox.SuspendLayout();
		this.P4_ItemRounding_groupBox.SuspendLayout();
		this.P4_UPriceRadixPoint_groupBox.SuspendLayout();
		this.P4_TotalRadixPoint_groupBox.SuspendLayout();
		this.w5th_panel.SuspendLayout();
		this.P3_noPLUinfo_groupBox.SuspendLayout();
		this.P3_2_panel.SuspendLayout();
		this.panel6.SuspendLayout();
		this.P3_1_panel.SuspendLayout();
		this.P3_PLUinfo_groupBox.SuspendLayout();
		this.plu_panel.SuspendLayout();
		this.P7_panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLUPSDateBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.classBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLU_TaxTypeBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingSource1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingSource2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.bitmapBindingSource2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingNavigator).BeginInit();
		this.pLUBindingNavigator.SuspendLayout();
		this.face_panel.SuspendLayout();
		this.tmsout_panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.export_ethernet_PictureBox).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.export_usb_PictureBox).BeginInit();
		this.panel14.SuspendLayout();
		this.opMain_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.labelSortBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelVersionBindingSource).BeginInit();
		base.SuspendLayout();
		this.pt_Left_SplitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.pt_Left_SplitContainer, "pt_Left_SplitContainer");
		this.pt_Left_SplitContainer.Name = "pt_Left_SplitContainer";
		this.pt_Left_SplitContainer.Panel1.Controls.Add(this.pt_LeftUD_SplitContainer);
		resources.ApplyResources(this.pt_Left_SplitContainer.Panel2, "pt_Left_SplitContainer.Panel2");
		this.pt_Left_SplitContainer.Panel2.BackColor = System.Drawing.SystemColors.AppWorkspace;
		this.pt_Left_SplitContainer.Panel2.Controls.Add(this.pt_Mid_SplitContainer);
		resources.ApplyResources(this.pt_LeftUD_SplitContainer, "pt_LeftUD_SplitContainer");
		this.pt_LeftUD_SplitContainer.Name = "pt_LeftUD_SplitContainer";
		this.pt_LeftUD_SplitContainer.Panel1.Controls.Add(this.pt_LeftUDU_SplitContainer);
		resources.ApplyResources(this.pt_LeftUD_SplitContainer.Panel1, "pt_LeftUD_SplitContainer.Panel1");
		this.pt_LeftUD_SplitContainer.Panel2.Controls.Add(this.pt_LeftUDD_SplitContainer);
		resources.ApplyResources(this.pt_LeftUD_SplitContainer.Panel2, "pt_LeftUD_SplitContainer.Panel2");
		this.pt_LeftUDU_SplitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.pt_LeftUDU_SplitContainer, "pt_LeftUDU_SplitContainer");
		this.pt_LeftUDU_SplitContainer.Name = "pt_LeftUDU_SplitContainer";
		this.pt_LeftUDU_SplitContainer.Panel1.Controls.Add(this.labelDataGridView);
		this.pt_LeftUDU_SplitContainer.Panel1.Controls.Add(this.labelBindingNavigator);
		resources.ApplyResources(this.pt_LeftUDU_SplitContainer.Panel1, "pt_LeftUDU_SplitContainer.Panel1");
		resources.ApplyResources(this.pt_LeftUDU_SplitContainer.Panel2, "pt_LeftUDU_SplitContainer.Panel2");
		this.pt_LeftUDU_SplitContainer.Panel2.Controls.Add(label);
		this.pt_LeftUDU_SplitContainer.Panel2.Controls.Add(this.PPwidthNumericUpDown);
		this.pt_LeftUDU_SplitContainer.Panel2.Controls.Add(this.PPheightNumericUpDown);
		this.pt_LeftUDU_SplitContainer.Panel2.Controls.Add(this.PPheightMMNumericUpDown);
		this.pt_LeftUDU_SplitContainer.Panel2.Controls.Add(label2);
		this.pt_LeftUDU_SplitContainer.Panel2.Controls.Add(this.PPwidthMMNumericUpDown);
		this.pt_LeftUDU_SplitContainer.Panel2.Controls.Add(this.heightLabel);
		this.pt_LeftUDU_SplitContainer.Panel2.Controls.Add(this.widthLabel);
		this.labelDataGridView.AllowUserToAddRows = false;
		this.labelDataGridView.AutoGenerateColumns = false;
		this.labelDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.labelDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.None;
		resources.ApplyResources(this.labelDataGridView, "labelDataGridView");
		this.labelDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.labelDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn1, this.dataGridViewTextBoxColumn5);
		this.labelDataGridView.DataSource = this.labelBindingSource;
		this.labelDataGridView.Name = "labelDataGridView";
		this.labelDataGridView.RowTemplate.Height = 23;
		this.labelDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.dataGridViewTextBoxColumn1.DataPropertyName = "LabelID";
		resources.ApplyResources(this.dataGridViewTextBoxColumn1, "dataGridViewTextBoxColumn1");
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.dataGridViewTextBoxColumn5.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn5.DataPropertyName = "Name";
		resources.ApplyResources(this.dataGridViewTextBoxColumn5, "dataGridViewTextBoxColumn5");
		this.dataGridViewTextBoxColumn5.Name = "dataGridViewTextBoxColumn5";
		this.labelBindingSource.DataMember = "Label";
		this.labelBindingSource.DataSource = this.eCSDataSet;
		this.labelBindingSource.Sort = "LabelID";
		this.labelBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(labelBindingSource_BindingComplete);
		this.labelBindingSource.CurrentChanged += new System.EventHandler(labelBindingSource_CurrentChanged);
		this.labelBindingSource.PositionChanged += new System.EventHandler(labelBindingSource_PositionChanged);
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.labelBindingNavigator.AddNewItem = null;
		this.labelBindingNavigator.BindingSource = this.labelBindingSource;
		this.labelBindingNavigator.CountItem = null;
		this.labelBindingNavigator.DeleteItem = null;
		this.labelBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[2] { this.bindingNavigatorAddNewItem, this.bindingNavigatorDeleteItem });
		resources.ApplyResources(this.labelBindingNavigator, "labelBindingNavigator");
		this.labelBindingNavigator.MoveFirstItem = null;
		this.labelBindingNavigator.MoveLastItem = null;
		this.labelBindingNavigator.MoveNextItem = null;
		this.labelBindingNavigator.MovePreviousItem = null;
		this.labelBindingNavigator.Name = "labelBindingNavigator";
		this.labelBindingNavigator.PositionItem = null;
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		this.bindingNavigatorAddNewItem.Click += new System.EventHandler(bindingNavigatorAddNewItem_Click);
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		this.bindingNavigatorDeleteItem.Click += new System.EventHandler(bindingNavigatorDeleteItem_Click);
		resources.ApplyResources(label, "mmLabel1");
		label.Name = "mmLabel1";
		this.PPwidthNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.labelBindingSource, "Width", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.PPwidthNumericUpDown, "PPwidthNumericUpDown");
		this.PPwidthNumericUpDown.Maximum = new decimal(new int[4] { 2048, 0, 0, 0 });
		this.PPwidthNumericUpDown.Name = "PPwidthNumericUpDown";
		this.PPwidthNumericUpDown.Value = new decimal(new int[4] { 10, 0, 0, 0 });
		this.PPwidthNumericUpDown.ValueChanged += new System.EventHandler(PPheightNumericUpDown_ValueChanged);
		this.PPheightNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.labelBindingSource, "Height", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.PPheightNumericUpDown, "PPheightNumericUpDown");
		this.PPheightNumericUpDown.Maximum = new decimal(new int[4] { 4096, 0, 0, 0 });
		this.PPheightNumericUpDown.Name = "PPheightNumericUpDown";
		this.PPheightNumericUpDown.Value = new decimal(new int[4] { 10, 0, 0, 0 });
		this.PPheightNumericUpDown.ValueChanged += new System.EventHandler(PPheightNumericUpDown_ValueChanged);
		resources.ApplyResources(this.PPheightMMNumericUpDown, "PPheightMMNumericUpDown");
		this.PPheightMMNumericUpDown.Maximum = new decimal(new int[4] { 65536, 0, 0, 0 });
		this.PPheightMMNumericUpDown.Name = "PPheightMMNumericUpDown";
		this.PPheightMMNumericUpDown.ValueChanged += new System.EventHandler(PPheightNumericUpDown_ValueChanged);
		resources.ApplyResources(label2, "mmLabel2");
		label2.Name = "mmLabel2";
		resources.ApplyResources(this.PPwidthMMNumericUpDown, "PPwidthMMNumericUpDown");
		this.PPwidthMMNumericUpDown.Maximum = new decimal(new int[4] { 65536, 0, 0, 0 });
		this.PPwidthMMNumericUpDown.Name = "PPwidthMMNumericUpDown";
		this.PPwidthMMNumericUpDown.ValueChanged += new System.EventHandler(PPheightNumericUpDown_ValueChanged);
		resources.ApplyResources(this.heightLabel, "heightLabel");
		this.heightLabel.Name = "heightLabel";
		resources.ApplyResources(this.widthLabel, "widthLabel");
		this.widthLabel.Name = "widthLabel";
		this.pt_LeftUDD_SplitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.pt_LeftUDD_SplitContainer, "pt_LeftUDD_SplitContainer");
		this.pt_LeftUDD_SplitContainer.Name = "pt_LeftUDD_SplitContainer";
		this.pt_LeftUDD_SplitContainer.Panel1.Controls.Add(this.labelitemDataGridView);
		this.pt_LeftUDD_SplitContainer.Panel1.Controls.Add(this.labelItemBindingNavigator);
		resources.ApplyResources(this.pt_LeftUDD_SplitContainer.Panel1, "pt_LeftUDD_SplitContainer.Panel1");
		this.pt_LeftUDD_SplitContainer.Panel2.Controls.Add(this.panel5);
		resources.ApplyResources(this.pt_LeftUDD_SplitContainer.Panel2, "pt_LeftUDD_SplitContainer.Panel2");
		this.labelitemDataGridView.AllowUserToAddRows = false;
		this.labelitemDataGridView.AutoGenerateColumns = false;
		this.labelitemDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.labelitemDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.None;
		resources.ApplyResources(this.labelitemDataGridView, "labelitemDataGridView");
		this.labelitemDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.labelitemDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn3, this.Display);
		this.labelitemDataGridView.DataSource = this.labelItemBindingSource;
		this.labelitemDataGridView.Name = "labelitemDataGridView";
		this.labelitemDataGridView.RowTemplate.Height = 23;
		this.labelitemDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.labelitemDataGridView.KeyDown += new System.Windows.Forms.KeyEventHandler(printFormatItem_DataGridView_KeyDown);
		this.labelitemDataGridView.KeyUp += new System.Windows.Forms.KeyEventHandler(printFormatItem_DataGridView_KeyUp);
		this.dataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
		this.dataGridViewTextBoxColumn3.DataPropertyName = "SubID";
		this.dataGridViewTextBoxColumn3.FillWeight = 50.76142f;
		resources.ApplyResources(this.dataGridViewTextBoxColumn3, "dataGridViewTextBoxColumn3");
		this.dataGridViewTextBoxColumn3.Name = "dataGridViewTextBoxColumn3";
		this.Display.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.Display.DataPropertyName = "Display";
		this.Display.FillWeight = 149.2386f;
		resources.ApplyResources(this.Display, "Display");
		this.Display.Name = "Display";
		this.Display.ReadOnly = true;
		this.labelItemBindingSource.DataMember = "FK_Label_LabelItem";
		this.labelItemBindingSource.DataSource = this.labelBindingSource;
		this.labelItemBindingSource.Sort = "";
		this.labelItemBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(labelItemBindingSource_BindingComplete);
		this.labelItemBindingSource.DataSourceChanged += new System.EventHandler(labelItemBindingSource_DataSourceChanged);
		this.labelItemBindingSource.PositionChanged += new System.EventHandler(labelItemBindingSource_PositionChanged);
		this.labelItemBindingNavigator.AddNewItem = null;
		this.labelItemBindingNavigator.BindingSource = this.labelItemBindingSource;
		this.labelItemBindingNavigator.CountItem = null;
		this.labelItemBindingNavigator.DeleteItem = this.toolStripButton2;
		this.labelItemBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[3] { this.toolStripButton1, this.toolStripButton2, this.cloneToolStripButton });
		resources.ApplyResources(this.labelItemBindingNavigator, "labelItemBindingNavigator");
		this.labelItemBindingNavigator.MoveFirstItem = null;
		this.labelItemBindingNavigator.MoveLastItem = null;
		this.labelItemBindingNavigator.MoveNextItem = null;
		this.labelItemBindingNavigator.MovePreviousItem = null;
		this.labelItemBindingNavigator.Name = "labelItemBindingNavigator";
		this.labelItemBindingNavigator.PositionItem = null;
		this.toolStripButton2.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.toolStripButton2, "toolStripButton2");
		this.toolStripButton2.Name = "toolStripButton2";
		this.toolStripButton1.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.toolStripButton1, "toolStripButton1");
		this.toolStripButton1.Name = "toolStripButton1";
		this.toolStripButton1.Click += new System.EventHandler(toolStripButton1_Click);
		this.cloneToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.cloneToolStripButton, "cloneToolStripButton");
		this.cloneToolStripButton.Name = "cloneToolStripButton";
		this.cloneToolStripButton.Click += new System.EventHandler(cloneToolStripButton_Click);
		resources.ApplyResources(this.panel5, "panel5");
		this.panel5.Controls.Add(this.alignButton);
		this.panel5.Controls.Add(this.flagButton);
		this.panel5.Controls.Add(this.printLabel);
		this.panel5.Controls.Add(this.printComboBox);
		this.panel5.Controls.Add(this.alignComboBox);
		this.panel5.Controls.Add(this.alignLabel);
		this.panel5.Controls.Add(this.angleComboBox);
		this.panel5.Controls.Add(this.fontLabel);
		this.panel5.Controls.Add(this.fontComboBox);
		this.panel5.Controls.Add(this.angleLabel);
		this.panel5.Name = "panel5";
		resources.ApplyResources(this.alignButton, "alignButton");
		this.alignButton.Name = "alignButton";
		this.alignButton.UseVisualStyleBackColor = true;
		this.alignButton.Click += new System.EventHandler(alignButton_Click);
		this.flagButton.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.labelItemBindingSource, "Display", true));
		resources.ApplyResources(this.flagButton, "flagButton");
		this.flagButton.Name = "flagButton";
		this.flagButton.UseVisualStyleBackColor = true;
		this.flagButton.Click += new System.EventHandler(flagButton_Click);
		resources.ApplyResources(this.printLabel, "printLabel");
		this.printLabel.Name = "printLabel";
		this.printComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.labelItemBindingSource, "Print", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.printComboBox.DataSource = this.labelItemPrintBindingSource;
		this.printComboBox.DisplayMember = "Display";
		this.printComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.printComboBox.DropDownWidth = 200;
		this.printComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.printComboBox, "printComboBox");
		this.printComboBox.Name = "printComboBox";
		this.printComboBox.ValueMember = "Value";
		this.labelItemPrintBindingSource.DataMember = "LabelItem_Print";
		this.labelItemPrintBindingSource.DataSource = this.uIDataSet;
		this.labelItemPrintBindingSource.Sort = "Value";
		this.uIDataSet.DataSetName = "UIDataSet";
		this.uIDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uIDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.alignComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.labelItemBindingSource, "Align", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.alignComboBox.DataSource = this.labelItemAlignBindingSource;
		this.alignComboBox.DisplayMember = "Display";
		this.alignComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.alignComboBox.DropDownWidth = 200;
		this.alignComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.alignComboBox, "alignComboBox");
		this.alignComboBox.Name = "alignComboBox";
		this.alignComboBox.ValueMember = "Value";
		this.labelItemAlignBindingSource.DataMember = "LabelItem_Align";
		this.labelItemAlignBindingSource.DataSource = this.uIDataSet;
		this.labelItemAlignBindingSource.Sort = "Value";
		resources.ApplyResources(this.alignLabel, "alignLabel");
		this.alignLabel.Name = "alignLabel";
		this.angleComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.labelItemBindingSource, "Angle", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.angleComboBox.DataSource = this.labelItemAngleBindingSource;
		this.angleComboBox.DisplayMember = "Display";
		this.angleComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.angleComboBox.DropDownWidth = 200;
		this.angleComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.angleComboBox, "angleComboBox");
		this.angleComboBox.Name = "angleComboBox";
		this.angleComboBox.ValueMember = "Value";
		this.labelItemAngleBindingSource.DataMember = "LabelItem_Angle";
		this.labelItemAngleBindingSource.DataSource = this.uIDataSet;
		this.labelItemAngleBindingSource.Sort = "Value";
		resources.ApplyResources(this.fontLabel, "fontLabel");
		this.fontLabel.Name = "fontLabel";
		this.fontComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.labelItemBindingSource, "Font", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.fontComboBox.DataSource = this.labelItemFontBindingSource;
		this.fontComboBox.DisplayMember = "Display";
		this.fontComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.fontComboBox.DropDownWidth = 200;
		this.fontComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.fontComboBox, "fontComboBox");
		this.fontComboBox.Name = "fontComboBox";
		this.fontComboBox.ValueMember = "Value";
		this.labelItemFontBindingSource.DataMember = "LabelItem_Font1";
		this.labelItemFontBindingSource.DataSource = this.uIDataSet;
		this.labelItemFontBindingSource.Sort = "Value";
		resources.ApplyResources(this.angleLabel, "angleLabel");
		this.angleLabel.Name = "angleLabel";
		this.pt_Mid_SplitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.pt_Mid_SplitContainer, "pt_Mid_SplitContainer");
		this.pt_Mid_SplitContainer.Name = "pt_Mid_SplitContainer";
		this.pt_Mid_SplitContainer.Panel1.BackColor = System.Drawing.SystemColors.Control;
		this.pt_Mid_SplitContainer.Panel1.Controls.Add(this.PT_Rotate_checkBox);
		this.pt_Mid_SplitContainer.Panel1.Controls.Add(this.PT_EditClone_Button);
		this.pt_Mid_SplitContainer.Panel1.Controls.Add(this.PT_Back_Button);
		resources.ApplyResources(this.pt_Mid_SplitContainer.Panel2, "pt_Mid_SplitContainer.Panel2");
		this.pt_Mid_SplitContainer.Panel2.Controls.Add(this.panel1);
		this.pt_Mid_SplitContainer.Panel2.Controls.Add(this.pt_Mid_StatusStrip);
		resources.ApplyResources(this.PT_Rotate_checkBox, "PT_Rotate_checkBox");
		this.PT_Rotate_checkBox.Name = "PT_Rotate_checkBox";
		this.PT_Rotate_checkBox.UseVisualStyleBackColor = true;
		this.PT_EditClone_Button.ForeColor = System.Drawing.Color.Red;
		resources.ApplyResources(this.PT_EditClone_Button, "PT_EditClone_Button");
		this.PT_EditClone_Button.Name = "PT_EditClone_Button";
		this.PT_EditClone_Button.UseVisualStyleBackColor = true;
		this.PT_EditClone_Button.Click += new System.EventHandler(PT_EditClone_Button_Click);
		this.PT_Back_Button.ForeColor = System.Drawing.Color.Red;
		resources.ApplyResources(this.PT_Back_Button, "PT_Back_Button");
		this.PT_Back_Button.Name = "PT_Back_Button";
		this.PT_Back_Button.UseVisualStyleBackColor = true;
		this.PT_Back_Button.Click += new System.EventHandler(PT_Back_Button_Click);
		resources.ApplyResources(this.panel1, "panel1");
		this.panel1.Controls.Add(this.subPanel);
		this.panel1.Name = "panel1";
		resources.ApplyResources(this.subPanel, "subPanel");
		this.subPanel.Name = "subPanel";
		this.subPanel.Paint += new System.Windows.Forms.PaintEventHandler(subPanel_Paint);
		this.subPanel.MouseDoubleClick += new System.Windows.Forms.MouseEventHandler(subPanel_MouseDoubleClick);
		this.subPanel.MouseDown += new System.Windows.Forms.MouseEventHandler(subPanel_MouseDown);
		this.subPanel.MouseMove += new System.Windows.Forms.MouseEventHandler(subPanel_MouseMove);
		this.subPanel.MouseUp += new System.Windows.Forms.MouseEventHandler(subPanel_MouseUp);
		this.pt_Mid_StatusStrip.BackColor = System.Drawing.SystemColors.Control;
		this.pt_Mid_StatusStrip.Items.AddRange(new System.Windows.Forms.ToolStripItem[3] { this.pt_Mid_Height_TSSLabel, this.pt_Mid_NULL_TSSLabel, this.pt_Mid_Width_TSSLabel });
		resources.ApplyResources(this.pt_Mid_StatusStrip, "pt_Mid_StatusStrip");
		this.pt_Mid_StatusStrip.Name = "pt_Mid_StatusStrip";
		this.pt_Mid_StatusStrip.RenderMode = System.Windows.Forms.ToolStripRenderMode.ManagerRenderMode;
		this.pt_Mid_Height_TSSLabel.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Text;
		this.pt_Mid_Height_TSSLabel.Name = "pt_Mid_Height_TSSLabel";
		resources.ApplyResources(this.pt_Mid_Height_TSSLabel, "pt_Mid_Height_TSSLabel");
		this.pt_Mid_NULL_TSSLabel.Name = "pt_Mid_NULL_TSSLabel";
		resources.ApplyResources(this.pt_Mid_NULL_TSSLabel, "pt_Mid_NULL_TSSLabel");
		this.pt_Mid_NULL_TSSLabel.Spring = true;
		this.pt_Mid_Width_TSSLabel.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Text;
		this.pt_Mid_Width_TSSLabel.Name = "pt_Mid_Width_TSSLabel";
		resources.ApplyResources(this.pt_Mid_Width_TSSLabel, "pt_Mid_Width_TSSLabel");
		resources.ApplyResources(this.pt_Right_SplitContainer, "pt_Right_SplitContainer");
		this.pt_Right_SplitContainer.Name = "pt_Right_SplitContainer";
		resources.ApplyResources(this.pt_Right_SplitContainer.Panel1, "pt_Right_SplitContainer.Panel1");
		this.pt_Right_SplitContainer.Panel1.Controls.Add(this.pt_Sample_PictureBox);
		this.pt_Right_SplitContainer.Panel1Collapsed = true;
		resources.ApplyResources(this.pt_Right_SplitContainer.Panel2, "pt_Right_SplitContainer.Panel2");
		this.pt_Right_SplitContainer.Panel2.Controls.Add(this.tp_Info_TableLayoutPanel);
		resources.ApplyResources(this.pt_Sample_PictureBox, "pt_Sample_PictureBox");
		this.pt_Sample_PictureBox.Name = "pt_Sample_PictureBox";
		this.pt_Sample_PictureBox.TabStop = false;
		resources.ApplyResources(this.tp_Info_TableLayoutPanel, "tp_Info_TableLayoutPanel");
		this.tp_Info_TableLayoutPanel.Controls.Add(this.pt_InfoTextSample_Panel, 0, 1);
		this.tp_Info_TableLayoutPanel.Controls.Add(this.pt_Picture_Panel, 0, 0);
		this.tp_Info_TableLayoutPanel.Name = "tp_Info_TableLayoutPanel";
		this.pt_InfoTextSample_Panel.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.pt_InfoTextSample_Panel.Controls.Add(this.pt_InfoTextSample_TextBox);
		this.pt_InfoTextSample_Panel.Controls.Add(this.pt_InfoTextSample_Label);
		resources.ApplyResources(this.pt_InfoTextSample_Panel, "pt_InfoTextSample_Panel");
		this.pt_InfoTextSample_Panel.Name = "pt_InfoTextSample_Panel";
		resources.ApplyResources(this.pt_InfoTextSample_TextBox, "pt_InfoTextSample_TextBox");
		this.pt_InfoTextSample_TextBox.Name = "pt_InfoTextSample_TextBox";
		resources.ApplyResources(this.pt_InfoTextSample_Label, "pt_InfoTextSample_Label");
		this.pt_InfoTextSample_Label.Name = "pt_InfoTextSample_Label";
		this.pt_Picture_Panel.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.pt_Picture_Panel.Controls.Add(this.pt_Picture_ClearButton);
		this.pt_Picture_Panel.Controls.Add(this.pt_Picture_SelectButton);
		this.pt_Picture_Panel.Controls.Add(this.pt_Picture_PictureBox);
		this.pt_Picture_Panel.Controls.Add(this.pt_Picture_ComboBox);
		this.pt_Picture_Panel.Controls.Add(this.pt_Picture_Label);
		resources.ApplyResources(this.pt_Picture_Panel, "pt_Picture_Panel");
		this.pt_Picture_Panel.Name = "pt_Picture_Panel";
		resources.ApplyResources(this.pt_Picture_ClearButton, "pt_Picture_ClearButton");
		this.pt_Picture_ClearButton.Name = "pt_Picture_ClearButton";
		this.pt_Picture_ClearButton.UseVisualStyleBackColor = true;
		this.pt_Picture_ClearButton.Click += new System.EventHandler(pt_Picture_ClearButton_Click);
		resources.ApplyResources(this.pt_Picture_SelectButton, "pt_Picture_SelectButton");
		this.pt_Picture_SelectButton.Name = "pt_Picture_SelectButton";
		this.pt_Picture_SelectButton.UseVisualStyleBackColor = true;
		this.pt_Picture_SelectButton.Click += new System.EventHandler(pt_Picture_SelectButton_Click);
		this.pt_Picture_PictureBox.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.pt_Picture_PictureBox, "pt_Picture_PictureBox");
		this.pt_Picture_PictureBox.Name = "pt_Picture_PictureBox";
		this.pt_Picture_PictureBox.TabStop = false;
		this.pt_Picture_PictureBox.Click += new System.EventHandler(pt_Picture_PictureBox_Click);
		this.pt_Picture_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.pt_Picture_ComboBox, "pt_Picture_ComboBox");
		this.pt_Picture_ComboBox.Name = "pt_Picture_ComboBox";
		this.pt_Picture_ComboBox.SelectedValueChanged += new System.EventHandler(pt_Picture_ComboBox_SelectedValueChanged);
		resources.ApplyResources(this.pt_Picture_Label, "pt_Picture_Label");
		this.pt_Picture_Label.Name = "pt_Picture_Label";
		this.splitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer, "splitContainer");
		this.splitContainer.FixedPanel = System.Windows.Forms.FixedPanel.Panel2;
		this.splitContainer.Name = "splitContainer";
		resources.ApplyResources(this.splitContainer.Panel1, "splitContainer.Panel1");
		this.splitContainer.Panel1.Controls.Add(this.myPanel);
		this.splitContainer.Panel2.Controls.Add(this.Print_Button);
		this.splitContainer.Panel2.Controls.Add(this.delButton);
		this.splitContainer.Panel2.Controls.Add(this.addButton);
		this.splitContainer.Panel2.Controls.Add(this.autoButton);
		this.splitContainer.Panel2.Controls.Add(this.clearButton);
		this.splitContainer.Panel2.Controls.Add(this.idCheckBox);
		this.splitContainer.Panel2.Controls.Add(this.faceLabel);
		this.splitContainer.Panel2.Controls.Add(this.faceComboBox);
		this.splitContainer.Panel2.Controls.Add(this.scaleID_Label);
		this.splitContainer.Panel2.Controls.Add(this.layoutLabel);
		this.splitContainer.Panel2.Controls.Add(this.faceListComboBox);
		this.splitContainer.Panel2.Controls.Add(this.layoutComboBox);
		this.splitContainer.Panel2.Controls.Add(this.fontButton);
		this.splitContainer.Panel2.Controls.Add(this.saveButton);
		this.splitContainer.TabStop = false;
		resources.ApplyResources(this.myPanel, "myPanel");
		this.myPanel.Name = "myPanel";
		this.myPanel.Paint += new System.Windows.Forms.PaintEventHandler(myPanel_Paint);
		this.myPanel.MouseClick += new System.Windows.Forms.MouseEventHandler(pictureBox_MouseClick);
		this.myPanel.MouseMove += new System.Windows.Forms.MouseEventHandler(pictureBox_MouseMove);
		resources.ApplyResources(this.Print_Button, "Print_Button");
		this.Print_Button.Name = "Print_Button";
		this.Print_Button.UseVisualStyleBackColor = true;
		this.Print_Button.Click += new System.EventHandler(Print_Button_Click);
		resources.ApplyResources(this.delButton, "delButton");
		this.delButton.Name = "delButton";
		this.delButton.UseVisualStyleBackColor = true;
		this.delButton.Click += new System.EventHandler(delButton_Click);
		resources.ApplyResources(this.addButton, "addButton");
		this.addButton.Name = "addButton";
		this.addButton.UseVisualStyleBackColor = true;
		this.addButton.Click += new System.EventHandler(addButton_Click);
		resources.ApplyResources(this.autoButton, "autoButton");
		this.autoButton.Name = "autoButton";
		this.autoButton.UseVisualStyleBackColor = true;
		this.autoButton.Click += new System.EventHandler(autoButton_Click);
		resources.ApplyResources(this.clearButton, "clearButton");
		this.clearButton.Name = "clearButton";
		this.clearButton.UseVisualStyleBackColor = true;
		this.clearButton.Click += new System.EventHandler(clearButton_Click);
		resources.ApplyResources(this.idCheckBox, "idCheckBox");
		this.idCheckBox.Name = "idCheckBox";
		this.idCheckBox.UseVisualStyleBackColor = true;
		this.idCheckBox.CheckedChanged += new System.EventHandler(idCheckBox_CheckedChanged);
		resources.ApplyResources(this.faceLabel, "faceLabel");
		this.faceLabel.Name = "faceLabel";
		this.faceComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.faceListBindingSource, "PageMode", true));
		this.faceComboBox.DataSource = this.scPLUP_bindingSource;
		this.faceComboBox.DisplayMember = "Display";
		this.faceComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.faceComboBox.DropDownWidth = 250;
		this.faceComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.faceComboBox, "faceComboBox");
		this.faceComboBox.Name = "faceComboBox";
		this.faceComboBox.ValueMember = "Page";
		this.faceListBindingSource.DataMember = "FaceList";
		this.faceListBindingSource.DataSource = this.eCSDataSet;
		this.faceListBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(faceListBindingSource_BindingComplete);
		this.scPLUP_bindingSource.DataMember = "ScPLU_Page";
		this.scPLUP_bindingSource.DataSource = this.uIDataSet;
		resources.ApplyResources(this.scaleID_Label, "scaleID_Label");
		this.scaleID_Label.Name = "scaleID_Label";
		resources.ApplyResources(this.layoutLabel, "layoutLabel");
		this.layoutLabel.Name = "layoutLabel";
		this.faceListComboBox.DataSource = this.faceListBindingSource;
		this.faceListComboBox.DisplayMember = "ScaleID";
		this.faceListComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.faceListComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.faceListComboBox, "faceListComboBox");
		this.faceListComboBox.Name = "faceListComboBox";
		this.faceListComboBox.ValueMember = "ScaleID";
		this.layoutComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.faceListBindingSource, "Layout", true));
		this.layoutComboBox.DataSource = this.scPLUL_bindingSource;
		this.layoutComboBox.DisplayMember = "Display";
		this.layoutComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.layoutComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.layoutComboBox, "layoutComboBox");
		this.layoutComboBox.Name = "layoutComboBox";
		this.layoutComboBox.ValueMember = "Layout";
		this.scPLUL_bindingSource.DataMember = "ScPLU_Layout";
		this.scPLUL_bindingSource.DataSource = this.uIDataSet;
		this.scPLUL_bindingSource.Filter = "[Display] <> '#NULL#'";
		resources.ApplyResources(this.fontButton, "fontButton");
		this.fontButton.Name = "fontButton";
		this.fontButton.UseVisualStyleBackColor = true;
		this.fontButton.Click += new System.EventHandler(fontButton_Click);
		resources.ApplyResources(this.saveButton, "saveButton");
		this.saveButton.Name = "saveButton";
		this.saveButton.UseVisualStyleBackColor = true;
		this.saveButton.Click += new System.EventHandler(saveButton_Click);
		resources.ApplyResources(this.pt_Top_SplitContainer, "pt_Top_SplitContainer");
		this.pt_Top_SplitContainer.Name = "pt_Top_SplitContainer";
		this.pt_Top_SplitContainer.Panel1Collapsed = true;
		this.pt_Top_SplitContainer.Panel2.Controls.Add(this.pt_Main_SplitContainer);
		this.pt_Main_SplitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.pt_Main_SplitContainer, "pt_Main_SplitContainer");
		this.pt_Main_SplitContainer.Name = "pt_Main_SplitContainer";
		this.pt_Main_SplitContainer.Panel1.Controls.Add(this.pt_Left_SplitContainer);
		this.pt_Main_SplitContainer.Panel2.Controls.Add(this.pt_Right_SplitContainer);
		resources.ApplyResources(this.Main_panel, "Main_panel");
		this.Main_panel.Controls.Add(this.tableLayoutPanel);
		this.Main_panel.Name = "Main_panel";
		resources.ApplyResources(this.tableLayoutPanel, "tableLayoutPanel");
		this.tableLayoutPanel.Controls.Add(this.TE_label, 0, 23);
		this.tableLayoutPanel.Controls.Add(this.pt_Panel, 0, 4);
		this.tableLayoutPanel.Controls.Add(this.Header_panel, 0, 0);
		this.tableLayoutPanel.Controls.Add(this.mode_Panel, 0, 3);
		this.tableLayoutPanel.Controls.Add(this.barcode_panel, 0, 5);
		this.tableLayoutPanel.Controls.Add(this.device_Panel, 0, 2);
		this.tableLayoutPanel.Controls.Add(this.manage_panel, 0, 6);
		this.tableLayoutPanel.Controls.Add(this.opconfig_panel, 0, 7);
		this.tableLayoutPanel.Controls.Add(this.unit_panel, 0, 9);
		this.tableLayoutPanel.Controls.Add(this.w5th_panel, 0, 11);
		this.tableLayoutPanel.Controls.Add(this.plu_panel, 0, 12);
		this.tableLayoutPanel.Controls.Add(this.face_panel, 0, 13);
		this.tableLayoutPanel.Controls.Add(this.tmsout_panel, 0, 14);
		this.tableLayoutPanel.Controls.Add(this.panel12, 0, 15);
		this.tableLayoutPanel.Controls.Add(this.panel13, 0, 16);
		this.tableLayoutPanel.Controls.Add(this.panel14, 0, 17);
		this.tableLayoutPanel.Controls.Add(this.panel2, 0, 18);
		this.tableLayoutPanel.Controls.Add(this.panel15, 0, 20);
		this.tableLayoutPanel.Controls.Add(this.panel16, 0, 21);
		this.tableLayoutPanel.Controls.Add(this.panel17, 0, 22);
		this.tableLayoutPanel.Controls.Add(this.panel3, 0, 19);
		this.tableLayoutPanel.Controls.Add(this.opMain_Panel, 0, 1);
		this.tableLayoutPanel.Name = "tableLayoutPanel";
		resources.ApplyResources(this.TE_label, "TE_label");
		this.TE_label.Name = "TE_label";
		this.pt_Panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.pt_Panel.Controls.Add(this.pt_Top_SplitContainer);
		resources.ApplyResources(this.pt_Panel, "pt_Panel");
		this.pt_Panel.Name = "pt_Panel";
		this.Header_panel.Controls.Add(this.NextDisable_Label);
		this.Header_panel.Controls.Add(this.Ethernet_button);
		this.Header_panel.Controls.Add(this.TMSFile_button);
		this.Header_panel.Controls.Add(this.Next_button);
		this.Header_panel.Controls.Add(this.Previous_button);
		resources.ApplyResources(this.Header_panel, "Header_panel");
		this.Header_panel.Name = "Header_panel";
		this.NextDisable_Label.ForeColor = System.Drawing.Color.Red;
		resources.ApplyResources(this.NextDisable_Label, "NextDisable_Label");
		this.NextDisable_Label.Name = "NextDisable_Label";
		resources.ApplyResources(this.Ethernet_button, "Ethernet_button");
		this.Ethernet_button.Name = "Ethernet_button";
		this.Ethernet_button.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.TMSFile_button, "TMSFile_button");
		this.TMSFile_button.Name = "TMSFile_button";
		this.TMSFile_button.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Next_button, "Next_button");
		this.Next_button.Name = "Next_button";
		this.Next_button.UseVisualStyleBackColor = true;
		this.Next_button.Click += new System.EventHandler(Next_button_Click);
		resources.ApplyResources(this.Previous_button, "Previous_button");
		this.Previous_button.Name = "Previous_button";
		this.Previous_button.UseVisualStyleBackColor = true;
		this.Previous_button.Click += new System.EventHandler(Previous_button_Click);
		this.mode_Panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.mode_Panel.Controls.Add(this.panel7);
		this.mode_Panel.Controls.Add(this.Mode_LabelPrint_RadioButton);
		this.mode_Panel.Controls.Add(this.Mode_PrintDirect_checkBox);
		this.mode_Panel.Controls.Add(this.Mode_CashRegister_RadioButton);
		this.mode_Panel.Controls.Add(this.Mode_ScanInternalBarcode_checkBox);
		this.mode_Panel.Controls.Add(this.Mode_OneItemOnly_checkBox);
		resources.ApplyResources(this.mode_Panel, "mode_Panel");
		this.mode_Panel.Name = "mode_Panel";
		this.panel7.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.panel7.Controls.Add(this.Mode_Gray_label);
		this.panel7.Controls.Add(this.Mode_GapPapper_Panel);
		this.panel7.Controls.Add(this.Mode_PlainPapper_Panel);
		this.panel7.Controls.Add(this.Mode_PlainPapper_RadioButton);
		this.panel7.Controls.Add(this.Mode_GapPapper_RadioButton);
		this.panel7.Controls.Add(this.Mode_Gray_numericUpDown);
		resources.ApplyResources(this.panel7, "panel7");
		this.panel7.Name = "panel7";
		resources.ApplyResources(this.Mode_Gray_label, "Mode_Gray_label");
		this.Mode_Gray_label.Name = "Mode_Gray_label";
		this.Mode_GapPapper_Panel.Controls.Add(this.Mode_GapPaper0_RadioButton);
		this.Mode_GapPapper_Panel.Controls.Add(this.Mode_GapPaper60x30_RadioButton);
		this.Mode_GapPapper_Panel.Controls.Add(this.Mode_GapPaper30x40_RadioButton);
		this.Mode_GapPapper_Panel.Controls.Add(this.Mode_GapPaper40x30_RadioButton);
		this.Mode_GapPapper_Panel.Controls.Add(this.Mode_GapPaper60x40_RadioButton);
		resources.ApplyResources(this.Mode_GapPapper_Panel, "Mode_GapPapper_Panel");
		this.Mode_GapPapper_Panel.Name = "Mode_GapPapper_Panel";
		resources.ApplyResources(this.Mode_GapPaper0_RadioButton, "Mode_GapPaper0_RadioButton");
		this.Mode_GapPaper0_RadioButton.Name = "Mode_GapPaper0_RadioButton";
		this.Mode_GapPaper0_RadioButton.UseVisualStyleBackColor = true;
		this.Mode_GapPaper0_RadioButton.CheckedChanged += new System.EventHandler(Mode_Changed);
		resources.ApplyResources(this.Mode_GapPaper60x30_RadioButton, "Mode_GapPaper60x30_RadioButton");
		this.Mode_GapPaper60x30_RadioButton.Name = "Mode_GapPaper60x30_RadioButton";
		this.Mode_GapPaper60x30_RadioButton.UseVisualStyleBackColor = true;
		this.Mode_GapPaper60x30_RadioButton.CheckedChanged += new System.EventHandler(Mode_Changed);
		resources.ApplyResources(this.Mode_GapPaper30x40_RadioButton, "Mode_GapPaper30x40_RadioButton");
		this.Mode_GapPaper30x40_RadioButton.Name = "Mode_GapPaper30x40_RadioButton";
		this.Mode_GapPaper30x40_RadioButton.UseVisualStyleBackColor = true;
		this.Mode_GapPaper30x40_RadioButton.CheckedChanged += new System.EventHandler(Mode_Changed);
		resources.ApplyResources(this.Mode_GapPaper40x30_RadioButton, "Mode_GapPaper40x30_RadioButton");
		this.Mode_GapPaper40x30_RadioButton.Name = "Mode_GapPaper40x30_RadioButton";
		this.Mode_GapPaper40x30_RadioButton.UseVisualStyleBackColor = true;
		this.Mode_GapPaper40x30_RadioButton.CheckedChanged += new System.EventHandler(Mode_Changed);
		resources.ApplyResources(this.Mode_GapPaper60x40_RadioButton, "Mode_GapPaper60x40_RadioButton");
		this.Mode_GapPaper60x40_RadioButton.Name = "Mode_GapPaper60x40_RadioButton";
		this.Mode_GapPaper60x40_RadioButton.UseVisualStyleBackColor = true;
		this.Mode_GapPaper60x40_RadioButton.CheckedChanged += new System.EventHandler(Mode_Changed);
		this.Mode_PlainPapper_Panel.Controls.Add(this.Mode_PlainPaper0_RadioButton);
		this.Mode_PlainPapper_Panel.Controls.Add(this.Mode_PlainPaper40_RadioButton);
		this.Mode_PlainPapper_Panel.Controls.Add(this.Mode_PlainPaper60_RadioButton);
		this.Mode_PlainPapper_Panel.Controls.Add(this.Mode_PlainPaper57_RadioButton);
		resources.ApplyResources(this.Mode_PlainPapper_Panel, "Mode_PlainPapper_Panel");
		this.Mode_PlainPapper_Panel.Name = "Mode_PlainPapper_Panel";
		resources.ApplyResources(this.Mode_PlainPaper0_RadioButton, "Mode_PlainPaper0_RadioButton");
		this.Mode_PlainPaper0_RadioButton.Name = "Mode_PlainPaper0_RadioButton";
		this.Mode_PlainPaper0_RadioButton.UseVisualStyleBackColor = true;
		this.Mode_PlainPaper0_RadioButton.CheckedChanged += new System.EventHandler(Mode_Changed);
		resources.ApplyResources(this.Mode_PlainPaper40_RadioButton, "Mode_PlainPaper40_RadioButton");
		this.Mode_PlainPaper40_RadioButton.Name = "Mode_PlainPaper40_RadioButton";
		this.Mode_PlainPaper40_RadioButton.UseVisualStyleBackColor = true;
		this.Mode_PlainPaper40_RadioButton.CheckedChanged += new System.EventHandler(Mode_Changed);
		resources.ApplyResources(this.Mode_PlainPaper60_RadioButton, "Mode_PlainPaper60_RadioButton");
		this.Mode_PlainPaper60_RadioButton.Name = "Mode_PlainPaper60_RadioButton";
		this.Mode_PlainPaper60_RadioButton.UseVisualStyleBackColor = true;
		this.Mode_PlainPaper60_RadioButton.CheckedChanged += new System.EventHandler(Mode_Changed);
		resources.ApplyResources(this.Mode_PlainPaper57_RadioButton, "Mode_PlainPaper57_RadioButton");
		this.Mode_PlainPaper57_RadioButton.Name = "Mode_PlainPaper57_RadioButton";
		this.Mode_PlainPaper57_RadioButton.UseVisualStyleBackColor = true;
		this.Mode_PlainPaper57_RadioButton.CheckedChanged += new System.EventHandler(Mode_Changed);
		resources.ApplyResources(this.Mode_PlainPapper_RadioButton, "Mode_PlainPapper_RadioButton");
		this.Mode_PlainPapper_RadioButton.Name = "Mode_PlainPapper_RadioButton";
		this.Mode_PlainPapper_RadioButton.UseVisualStyleBackColor = true;
		this.Mode_PlainPapper_RadioButton.CheckedChanged += new System.EventHandler(Mode_Changed);
		resources.ApplyResources(this.Mode_GapPapper_RadioButton, "Mode_GapPapper_RadioButton");
		this.Mode_GapPapper_RadioButton.Name = "Mode_GapPapper_RadioButton";
		this.Mode_GapPapper_RadioButton.UseVisualStyleBackColor = true;
		this.Mode_GapPapper_RadioButton.CheckedChanged += new System.EventHandler(Mode_Changed);
		resources.ApplyResources(this.Mode_Gray_numericUpDown, "Mode_Gray_numericUpDown");
		this.Mode_Gray_numericUpDown.Maximum = new decimal(new int[4] { 12, 0, 0, 0 });
		this.Mode_Gray_numericUpDown.Minimum = new decimal(new int[4] { 5, 0, 0, 0 });
		this.Mode_Gray_numericUpDown.Name = "Mode_Gray_numericUpDown";
		this.Mode_Gray_numericUpDown.Value = new decimal(new int[4] { 10, 0, 0, 0 });
		this.Mode_Gray_numericUpDown.ValueChanged += new System.EventHandler(Mode_Changed);
		resources.ApplyResources(this.Mode_LabelPrint_RadioButton, "Mode_LabelPrint_RadioButton");
		this.Mode_LabelPrint_RadioButton.Checked = true;
		this.Mode_LabelPrint_RadioButton.Name = "Mode_LabelPrint_RadioButton";
		this.Mode_LabelPrint_RadioButton.TabStop = true;
		this.Mode_LabelPrint_RadioButton.UseVisualStyleBackColor = true;
		this.Mode_LabelPrint_RadioButton.CheckedChanged += new System.EventHandler(Mode_Changed);
		resources.ApplyResources(this.Mode_PrintDirect_checkBox, "Mode_PrintDirect_checkBox");
		this.Mode_PrintDirect_checkBox.Name = "Mode_PrintDirect_checkBox";
		this.Mode_PrintDirect_checkBox.UseVisualStyleBackColor = true;
		this.Mode_PrintDirect_checkBox.CheckedChanged += new System.EventHandler(Mode_Changed);
		resources.ApplyResources(this.Mode_CashRegister_RadioButton, "Mode_CashRegister_RadioButton");
		this.Mode_CashRegister_RadioButton.Name = "Mode_CashRegister_RadioButton";
		this.Mode_CashRegister_RadioButton.UseVisualStyleBackColor = true;
		this.Mode_CashRegister_RadioButton.CheckedChanged += new System.EventHandler(Mode_Changed);
		resources.ApplyResources(this.Mode_ScanInternalBarcode_checkBox, "Mode_ScanInternalBarcode_checkBox");
		this.Mode_ScanInternalBarcode_checkBox.Name = "Mode_ScanInternalBarcode_checkBox";
		this.Mode_ScanInternalBarcode_checkBox.UseVisualStyleBackColor = true;
		this.Mode_ScanInternalBarcode_checkBox.CheckedChanged += new System.EventHandler(Mode_Changed);
		resources.ApplyResources(this.Mode_OneItemOnly_checkBox, "Mode_OneItemOnly_checkBox");
		this.Mode_OneItemOnly_checkBox.Name = "Mode_OneItemOnly_checkBox";
		this.Mode_OneItemOnly_checkBox.UseVisualStyleBackColor = true;
		this.Mode_OneItemOnly_checkBox.CheckedChanged += new System.EventHandler(Mode_Changed);
		this.barcode_panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.barcode_panel.Controls.Add(this.tableLayoutPanel1);
		resources.ApplyResources(this.barcode_panel, "barcode_panel");
		this.barcode_panel.Name = "barcode_panel";
		resources.ApplyResources(this.tableLayoutPanel1, "tableLayoutPanel1");
		this.tableLayoutPanel1.Controls.Add(this.barcode_Special_Panel, 0, 3);
		this.tableLayoutPanel1.Controls.Add(this.barcode_CashRegister_RadioButton, 0, 0);
		this.tableLayoutPanel1.Controls.Add(this.barcode_CashRegister_Panel, 0, 1);
		this.tableLayoutPanel1.Controls.Add(this.barcode_Special_RadioButton, 0, 2);
		this.tableLayoutPanel1.Controls.Add(this.barcode_ManualEdit_Panel, 0, 5);
		this.tableLayoutPanel1.Controls.Add(this.barcode_ManualEdit_RadioButton, 0, 4);
		this.tableLayoutPanel1.Name = "tableLayoutPanel1";
		this.barcode_Special_Panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.barcode_Special_Panel.Controls.Add(this.barcode_Special_CheckDigit_CheckBox);
		this.barcode_Special_Panel.Controls.Add(this.barcode_Special_Type_ComboBox);
		this.barcode_Special_Panel.Controls.Add(this.barcode_Special_Type_Label);
		this.barcode_Special_Panel.Controls.Add(this.barcode_Special_PLUInfo_RadioButton);
		this.barcode_Special_Panel.Controls.Add(this.barcode_Special_Constant_TextBox);
		this.barcode_Special_Panel.Controls.Add(this.barcode_Special_PLUInfo_ComboBox);
		this.barcode_Special_Panel.Controls.Add(this.barcode_Special_Constant_RadioButton);
		resources.ApplyResources(this.barcode_Special_Panel, "barcode_Special_Panel");
		this.barcode_Special_Panel.Name = "barcode_Special_Panel";
		resources.ApplyResources(this.barcode_Special_CheckDigit_CheckBox, "barcode_Special_CheckDigit_CheckBox");
		this.barcode_Special_CheckDigit_CheckBox.Name = "barcode_Special_CheckDigit_CheckBox";
		this.barcode_Special_CheckDigit_CheckBox.UseVisualStyleBackColor = true;
		this.barcode_Special_CheckDigit_CheckBox.CheckedChanged += new System.EventHandler(barcode_Special_CheckDigit_CheckBox_CheckedChanged);
		this.barcode_Special_Type_ComboBox.DataSource = this.barcodeFormatBindingSource;
		this.barcode_Special_Type_ComboBox.DisplayMember = "Display";
		this.barcode_Special_Type_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.barcode_Special_Type_ComboBox, "barcode_Special_Type_ComboBox");
		this.barcode_Special_Type_ComboBox.Name = "barcode_Special_Type_ComboBox";
		this.barcode_Special_Type_ComboBox.ValueMember = "Value";
		this.barcode_Special_Type_ComboBox.SelectedIndexChanged += new System.EventHandler(barcode_Special_Type_ComboBox_SelectedIndexChanged);
		this.barcodeFormatBindingSource.DataMember = "Barcode_Format";
		this.barcodeFormatBindingSource.DataSource = this.uIDataSet;
		this.barcodeFormatBindingSource.Sort = "Value";
		resources.ApplyResources(this.barcode_Special_Type_Label, "barcode_Special_Type_Label");
		this.barcode_Special_Type_Label.Name = "barcode_Special_Type_Label";
		resources.ApplyResources(this.barcode_Special_PLUInfo_RadioButton, "barcode_Special_PLUInfo_RadioButton");
		this.barcode_Special_PLUInfo_RadioButton.Checked = true;
		this.barcode_Special_PLUInfo_RadioButton.Name = "barcode_Special_PLUInfo_RadioButton";
		this.barcode_Special_PLUInfo_RadioButton.TabStop = true;
		this.barcode_Special_PLUInfo_RadioButton.UseVisualStyleBackColor = true;
		this.barcode_Special_PLUInfo_RadioButton.CheckedChanged += new System.EventHandler(barcode_Special_XXX_RadioButton_CheckedChanged);
		resources.ApplyResources(this.barcode_Special_Constant_TextBox, "barcode_Special_Constant_TextBox");
		this.barcode_Special_Constant_TextBox.Name = "barcode_Special_Constant_TextBox";
		this.barcode_Special_Constant_TextBox.TextChanged += new System.EventHandler(barcode_Special_Constant_TextBox_TextChanged);
		this.barcode_Special_PLUInfo_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.barcode_Special_PLUInfo_ComboBox, "barcode_Special_PLUInfo_ComboBox");
		this.barcode_Special_PLUInfo_ComboBox.Name = "barcode_Special_PLUInfo_ComboBox";
		this.barcode_Special_PLUInfo_ComboBox.SelectedIndexChanged += new System.EventHandler(barcode_Special_PLUInfo_ComboBox_SelectedIndexChanged);
		resources.ApplyResources(this.barcode_Special_Constant_RadioButton, "barcode_Special_Constant_RadioButton");
		this.barcode_Special_Constant_RadioButton.Name = "barcode_Special_Constant_RadioButton";
		this.barcode_Special_Constant_RadioButton.UseVisualStyleBackColor = true;
		this.barcode_Special_Constant_RadioButton.CheckedChanged += new System.EventHandler(barcode_Special_XXX_RadioButton_CheckedChanged);
		resources.ApplyResources(this.barcode_CashRegister_RadioButton, "barcode_CashRegister_RadioButton");
		this.barcode_CashRegister_RadioButton.Name = "barcode_CashRegister_RadioButton";
		this.barcode_CashRegister_RadioButton.TabStop = true;
		this.barcode_CashRegister_RadioButton.UseVisualStyleBackColor = true;
		this.barcode_CashRegister_RadioButton.CheckedChanged += new System.EventHandler(barcode_MainType_RadioButton_CheckedChanged);
		this.barcode_CashRegister_Panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.barcode_CashRegister_Panel.Controls.Add(this.P1_Part7_groupBox);
		this.barcode_CashRegister_Panel.Controls.Add(this.P1_Part6_groupBox);
		this.barcode_CashRegister_Panel.Controls.Add(this.barcode_CashRegister_Info_Panel);
		this.barcode_CashRegister_Panel.Controls.Add(this.P1_Type_groupBox);
		this.barcode_CashRegister_Panel.Controls.Add(this.P1_Part3_4Sum_groupBox);
		this.barcode_CashRegister_Panel.Controls.Add(this.P1_Part1_2Sum_groupBox);
		this.barcode_CashRegister_Panel.Controls.Add(this.P1_Part2_groupBox);
		this.barcode_CashRegister_Panel.Controls.Add(this.P1_Part5_groupBox);
		this.barcode_CashRegister_Panel.Controls.Add(this.P1_Part1_groupBox);
		this.barcode_CashRegister_Panel.Controls.Add(this.P1_Part3_groupBox);
		this.barcode_CashRegister_Panel.Controls.Add(this.P1_Part4_groupBox);
		resources.ApplyResources(this.barcode_CashRegister_Panel, "barcode_CashRegister_Panel");
		this.barcode_CashRegister_Panel.Name = "barcode_CashRegister_Panel";
		this.P1_Part7_groupBox.Controls.Add(this.P1_P7_QRVersion_NumericUpDown);
		this.P1_Part7_groupBox.Controls.Add(this.QRSize_Label);
		this.P1_Part7_groupBox.Controls.Add(this.QRVersion_Label);
		this.P1_Part7_groupBox.Controls.Add(this.P1_P7_NoLastEnter_CheckBox);
		this.P1_Part7_groupBox.Controls.Add(this.P1_P7_SingleQR_CheckBox);
		this.P1_Part7_groupBox.Controls.Add(this.P1_P7_SumQR_RadioButton);
		this.P1_Part7_groupBox.Controls.Add(this.P1_P7_SumEAN_RadioButton);
		resources.ApplyResources(this.P1_Part7_groupBox, "P1_Part7_groupBox");
		this.P1_Part7_groupBox.Name = "P1_Part7_groupBox";
		this.P1_Part7_groupBox.TabStop = false;
		resources.ApplyResources(this.P1_P7_QRVersion_NumericUpDown, "P1_P7_QRVersion_NumericUpDown");
		this.P1_P7_QRVersion_NumericUpDown.Maximum = new decimal(new int[4] { 31, 0, 0, 0 });
		this.P1_P7_QRVersion_NumericUpDown.Minimum = new decimal(new int[4] { 1, 0, 0, 0 });
		this.P1_P7_QRVersion_NumericUpDown.Name = "P1_P7_QRVersion_NumericUpDown";
		this.P1_P7_QRVersion_NumericUpDown.Value = new decimal(new int[4] { 1, 0, 0, 0 });
		this.P1_P7_QRVersion_NumericUpDown.ValueChanged += new System.EventHandler(P1_P7_QRVersion_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.QRSize_Label, "QRSize_Label");
		this.QRSize_Label.Name = "QRSize_Label";
		resources.ApplyResources(this.QRVersion_Label, "QRVersion_Label");
		this.QRVersion_Label.Name = "QRVersion_Label";
		resources.ApplyResources(this.P1_P7_NoLastEnter_CheckBox, "P1_P7_NoLastEnter_CheckBox");
		this.P1_P7_NoLastEnter_CheckBox.Name = "P1_P7_NoLastEnter_CheckBox";
		this.P1_P7_NoLastEnter_CheckBox.UseVisualStyleBackColor = true;
		this.P1_P7_NoLastEnter_CheckBox.CheckedChanged += new System.EventHandler(P7_ItemValue);
		resources.ApplyResources(this.P1_P7_SingleQR_CheckBox, "P1_P7_SingleQR_CheckBox");
		this.P1_P7_SingleQR_CheckBox.Name = "P1_P7_SingleQR_CheckBox";
		this.P1_P7_SingleQR_CheckBox.UseVisualStyleBackColor = true;
		this.P1_P7_SingleQR_CheckBox.CheckedChanged += new System.EventHandler(P7_ItemValue);
		resources.ApplyResources(this.P1_P7_SumQR_RadioButton, "P1_P7_SumQR_RadioButton");
		this.P1_P7_SumQR_RadioButton.Checked = true;
		this.P1_P7_SumQR_RadioButton.Name = "P1_P7_SumQR_RadioButton";
		this.P1_P7_SumQR_RadioButton.TabStop = true;
		this.P1_P7_SumQR_RadioButton.UseVisualStyleBackColor = true;
		this.P1_P7_SumQR_RadioButton.CheckedChanged += new System.EventHandler(P7_ItemValue);
		resources.ApplyResources(this.P1_P7_SumEAN_RadioButton, "P1_P7_SumEAN_RadioButton");
		this.P1_P7_SumEAN_RadioButton.Name = "P1_P7_SumEAN_RadioButton";
		this.P1_P7_SumEAN_RadioButton.Tag = "";
		this.P1_P7_SumEAN_RadioButton.UseVisualStyleBackColor = true;
		this.P1_P7_SumEAN_RadioButton.CheckedChanged += new System.EventHandler(P7_ItemValue);
		this.P1_Part6_groupBox.Controls.Add(this.P1_Part6_PcsDecimal_NumericUpDown);
		this.P1_Part6_groupBox.Controls.Add(this.P1_Part6_PcsDecimal_Label);
		this.P1_Part6_groupBox.Controls.Add(this.P1_Part6_MoneyDecimal_NumericUpDown);
		this.P1_Part6_groupBox.Controls.Add(this.P1_Part6_MoneyDecimal_Label);
		this.P1_Part6_groupBox.Controls.Add(this.P1_Part6_WeightDecimal_NumericUpDown);
		this.P1_Part6_groupBox.Controls.Add(this.P1_Part6_WeightDecimal_Label);
		this.P1_Part6_groupBox.Controls.Add(this.P1_Part6_PcsDecimal_Ve_Label);
		this.P1_Part6_groupBox.Controls.Add(this.P1_Part6_WeightDecimal_Ve_Label);
		this.P1_Part6_groupBox.Controls.Add(this.P1_Part6_MoneyDecimal_Ve_Label);
		this.P1_Part6_groupBox.Controls.Add(this.P1_Part6_PcsDecimal_V2_Label);
		this.P1_Part6_groupBox.Controls.Add(this.P1_Part6_WeightDecimal_V2_Label);
		this.P1_Part6_groupBox.Controls.Add(this.P1_Part6_MoneyDecimal_V2_Label);
		this.P1_Part6_groupBox.Controls.Add(this.P1_Part6_PcsDecimal_V1_Label);
		this.P1_Part6_groupBox.Controls.Add(this.P1_Part6_WeightDecimal_V1_Label);
		this.P1_Part6_groupBox.Controls.Add(this.P1_Part6_MoneyDecimal_V1_Label);
		resources.ApplyResources(this.P1_Part6_groupBox, "P1_Part6_groupBox");
		this.P1_Part6_groupBox.Name = "P1_Part6_groupBox";
		this.P1_Part6_groupBox.TabStop = false;
		resources.ApplyResources(this.P1_Part6_PcsDecimal_NumericUpDown, "P1_Part6_PcsDecimal_NumericUpDown");
		this.P1_Part6_PcsDecimal_NumericUpDown.Maximum = new decimal(new int[4] { 5, 0, 0, 0 });
		this.P1_Part6_PcsDecimal_NumericUpDown.Name = "P1_Part6_PcsDecimal_NumericUpDown";
		this.P1_Part6_PcsDecimal_NumericUpDown.Value = new decimal(new int[4] { 3, 0, 0, 0 });
		this.P1_Part6_PcsDecimal_NumericUpDown.ValueChanged += new System.EventHandler(P1_Part6_xxxxDecimal_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.P1_Part6_PcsDecimal_Label, "P1_Part6_PcsDecimal_Label");
		this.P1_Part6_PcsDecimal_Label.Name = "P1_Part6_PcsDecimal_Label";
		resources.ApplyResources(this.P1_Part6_MoneyDecimal_NumericUpDown, "P1_Part6_MoneyDecimal_NumericUpDown");
		this.P1_Part6_MoneyDecimal_NumericUpDown.Maximum = new decimal(new int[4] { 5, 0, 0, 0 });
		this.P1_Part6_MoneyDecimal_NumericUpDown.Name = "P1_Part6_MoneyDecimal_NumericUpDown";
		this.P1_Part6_MoneyDecimal_NumericUpDown.Value = new decimal(new int[4] { 2, 0, 0, 0 });
		this.P1_Part6_MoneyDecimal_NumericUpDown.ValueChanged += new System.EventHandler(P1_Part6_xxxxDecimal_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.P1_Part6_MoneyDecimal_Label, "P1_Part6_MoneyDecimal_Label");
		this.P1_Part6_MoneyDecimal_Label.Name = "P1_Part6_MoneyDecimal_Label";
		resources.ApplyResources(this.P1_Part6_WeightDecimal_NumericUpDown, "P1_Part6_WeightDecimal_NumericUpDown");
		this.P1_Part6_WeightDecimal_NumericUpDown.Maximum = new decimal(new int[4] { 5, 0, 0, 0 });
		this.P1_Part6_WeightDecimal_NumericUpDown.Name = "P1_Part6_WeightDecimal_NumericUpDown";
		this.P1_Part6_WeightDecimal_NumericUpDown.Value = new decimal(new int[4] { 3, 0, 0, 0 });
		this.P1_Part6_WeightDecimal_NumericUpDown.ValueChanged += new System.EventHandler(P1_Part6_xxxxDecimal_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.P1_Part6_WeightDecimal_Label, "P1_Part6_WeightDecimal_Label");
		this.P1_Part6_WeightDecimal_Label.Name = "P1_Part6_WeightDecimal_Label";
		resources.ApplyResources(this.P1_Part6_PcsDecimal_Ve_Label, "P1_Part6_PcsDecimal_Ve_Label");
		this.P1_Part6_PcsDecimal_Ve_Label.Name = "P1_Part6_PcsDecimal_Ve_Label";
		resources.ApplyResources(this.P1_Part6_WeightDecimal_Ve_Label, "P1_Part6_WeightDecimal_Ve_Label");
		this.P1_Part6_WeightDecimal_Ve_Label.Name = "P1_Part6_WeightDecimal_Ve_Label";
		resources.ApplyResources(this.P1_Part6_MoneyDecimal_Ve_Label, "P1_Part6_MoneyDecimal_Ve_Label");
		this.P1_Part6_MoneyDecimal_Ve_Label.Name = "P1_Part6_MoneyDecimal_Ve_Label";
		resources.ApplyResources(this.P1_Part6_PcsDecimal_V2_Label, "P1_Part6_PcsDecimal_V2_Label");
		this.P1_Part6_PcsDecimal_V2_Label.Name = "P1_Part6_PcsDecimal_V2_Label";
		resources.ApplyResources(this.P1_Part6_WeightDecimal_V2_Label, "P1_Part6_WeightDecimal_V2_Label");
		this.P1_Part6_WeightDecimal_V2_Label.Name = "P1_Part6_WeightDecimal_V2_Label";
		resources.ApplyResources(this.P1_Part6_MoneyDecimal_V2_Label, "P1_Part6_MoneyDecimal_V2_Label");
		this.P1_Part6_MoneyDecimal_V2_Label.Name = "P1_Part6_MoneyDecimal_V2_Label";
		resources.ApplyResources(this.P1_Part6_PcsDecimal_V1_Label, "P1_Part6_PcsDecimal_V1_Label");
		this.P1_Part6_PcsDecimal_V1_Label.Name = "P1_Part6_PcsDecimal_V1_Label";
		resources.ApplyResources(this.P1_Part6_WeightDecimal_V1_Label, "P1_Part6_WeightDecimal_V1_Label");
		this.P1_Part6_WeightDecimal_V1_Label.Name = "P1_Part6_WeightDecimal_V1_Label";
		resources.ApplyResources(this.P1_Part6_MoneyDecimal_V1_Label, "P1_Part6_MoneyDecimal_V1_Label");
		this.P1_Part6_MoneyDecimal_V1_Label.Name = "P1_Part6_MoneyDecimal_V1_Label";
		this.barcode_CashRegister_Info_Panel.Controls.Add(this.barcode_CashRegister_Info_Label);
		resources.ApplyResources(this.barcode_CashRegister_Info_Panel, "barcode_CashRegister_Info_Panel");
		this.barcode_CashRegister_Info_Panel.Name = "barcode_CashRegister_Info_Panel";
		resources.ApplyResources(this.barcode_CashRegister_Info_Label, "barcode_CashRegister_Info_Label");
		this.barcode_CashRegister_Info_Label.ForeColor = System.Drawing.Color.Red;
		this.barcode_CashRegister_Info_Label.Name = "barcode_CashRegister_Info_Label";
		this.P1_Type_groupBox.Controls.Add(this.P1_Type15651_radioButton);
		this.P1_Type_groupBox.Controls.Add(this.P1_label2);
		this.P1_Type_groupBox.Controls.Add(this.P1_Type16551_radioButton);
		this.P1_Type_groupBox.Controls.Add(this.P1_Type2551_radioButton);
		this.P1_Type_groupBox.Controls.Add(this.P1_Type1561_radioButton);
		this.P1_Type_groupBox.Controls.Add(this.P1_Type2641_radioButton);
		this.P1_Type_groupBox.Controls.Add(this.P1_Type1651_radioButton);
		this.P1_Type_groupBox.Controls.Add(this.P1_Type25551_radioButton);
		this.P1_Type_groupBox.Controls.Add(this.P1_Type2461_radioButton);
		this.P1_Type_groupBox.Controls.Add(this.P1_label1);
		this.P1_Type_groupBox.Controls.Add(this.P1_Type26451_radioButton);
		this.P1_Type_groupBox.Controls.Add(this.P1_Type24651_radioButton);
		resources.ApplyResources(this.P1_Type_groupBox, "P1_Type_groupBox");
		this.P1_Type_groupBox.Name = "P1_Type_groupBox";
		this.P1_Type_groupBox.TabStop = false;
		resources.ApplyResources(this.P1_Type15651_radioButton, "P1_Type15651_radioButton");
		this.P1_Type15651_radioButton.Name = "P1_Type15651_radioButton";
		this.P1_Type15651_radioButton.UseVisualStyleBackColor = true;
		this.P1_Type15651_radioButton.CheckedChanged += new System.EventHandler(P1_TypeX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P1_label2, "P1_label2");
		this.P1_label2.Name = "P1_label2";
		resources.ApplyResources(this.P1_Type16551_radioButton, "P1_Type16551_radioButton");
		this.P1_Type16551_radioButton.Name = "P1_Type16551_radioButton";
		this.P1_Type16551_radioButton.UseVisualStyleBackColor = true;
		this.P1_Type16551_radioButton.CheckedChanged += new System.EventHandler(P1_TypeX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P1_Type2551_radioButton, "P1_Type2551_radioButton");
		this.P1_Type2551_radioButton.Name = "P1_Type2551_radioButton";
		this.P1_Type2551_radioButton.UseVisualStyleBackColor = true;
		this.P1_Type2551_radioButton.CheckedChanged += new System.EventHandler(P1_TypeX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P1_Type1561_radioButton, "P1_Type1561_radioButton");
		this.P1_Type1561_radioButton.Name = "P1_Type1561_radioButton";
		this.P1_Type1561_radioButton.UseVisualStyleBackColor = true;
		this.P1_Type1561_radioButton.CheckedChanged += new System.EventHandler(P1_TypeX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P1_Type2641_radioButton, "P1_Type2641_radioButton");
		this.P1_Type2641_radioButton.Name = "P1_Type2641_radioButton";
		this.P1_Type2641_radioButton.UseVisualStyleBackColor = true;
		this.P1_Type2641_radioButton.CheckedChanged += new System.EventHandler(P1_TypeX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P1_Type1651_radioButton, "P1_Type1651_radioButton");
		this.P1_Type1651_radioButton.Name = "P1_Type1651_radioButton";
		this.P1_Type1651_radioButton.UseVisualStyleBackColor = true;
		this.P1_Type1651_radioButton.CheckedChanged += new System.EventHandler(P1_TypeX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P1_Type25551_radioButton, "P1_Type25551_radioButton");
		this.P1_Type25551_radioButton.Name = "P1_Type25551_radioButton";
		this.P1_Type25551_radioButton.UseVisualStyleBackColor = true;
		this.P1_Type25551_radioButton.CheckedChanged += new System.EventHandler(P1_TypeX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P1_Type2461_radioButton, "P1_Type2461_radioButton");
		this.P1_Type2461_radioButton.Name = "P1_Type2461_radioButton";
		this.P1_Type2461_radioButton.UseVisualStyleBackColor = true;
		this.P1_Type2461_radioButton.CheckedChanged += new System.EventHandler(P1_TypeX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P1_label1, "P1_label1");
		this.P1_label1.Name = "P1_label1";
		resources.ApplyResources(this.P1_Type26451_radioButton, "P1_Type26451_radioButton");
		this.P1_Type26451_radioButton.Name = "P1_Type26451_radioButton";
		this.P1_Type26451_radioButton.UseVisualStyleBackColor = true;
		this.P1_Type26451_radioButton.CheckedChanged += new System.EventHandler(P1_TypeX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P1_Type24651_radioButton, "P1_Type24651_radioButton");
		this.P1_Type24651_radioButton.Name = "P1_Type24651_radioButton";
		this.P1_Type24651_radioButton.UseVisualStyleBackColor = true;
		this.P1_Type24651_radioButton.CheckedChanged += new System.EventHandler(P1_TypeX_radioButton_CheckedChanged);
		this.P1_Part3_4Sum_groupBox.Controls.Add(this.P1_P3_4TotalPcs_radioButton);
		this.P1_Part3_4Sum_groupBox.Controls.Add(this.P1_P3_4TotalWeight_radioButton);
		resources.ApplyResources(this.P1_Part3_4Sum_groupBox, "P1_Part3_4Sum_groupBox");
		this.P1_Part3_4Sum_groupBox.Name = "P1_Part3_4Sum_groupBox";
		this.P1_Part3_4Sum_groupBox.TabStop = false;
		resources.ApplyResources(this.P1_P3_4TotalPcs_radioButton, "P1_P3_4TotalPcs_radioButton");
		this.P1_P3_4TotalPcs_radioButton.Name = "P1_P3_4TotalPcs_radioButton";
		this.P1_P3_4TotalPcs_radioButton.UseVisualStyleBackColor = true;
		this.P1_P3_4TotalPcs_radioButton.CheckedChanged += new System.EventHandler(P2_P3_ItemValue);
		resources.ApplyResources(this.P1_P3_4TotalWeight_radioButton, "P1_P3_4TotalWeight_radioButton");
		this.P1_P3_4TotalWeight_radioButton.Name = "P1_P3_4TotalWeight_radioButton";
		this.P1_P3_4TotalWeight_radioButton.UseVisualStyleBackColor = true;
		this.P1_P3_4TotalWeight_radioButton.CheckedChanged += new System.EventHandler(P2_P3_ItemValue);
		this.P1_Part1_2Sum_groupBox.Controls.Add(this.P1_Part1_2Sum_UseItem_CheckBox);
		this.P1_Part1_2Sum_groupBox.Controls.Add(this.P1_P1_2SumFlag_numericUpDown);
		this.P1_Part1_2Sum_groupBox.Controls.Add(this.P1_P1_2_label);
		resources.ApplyResources(this.P1_Part1_2Sum_groupBox, "P1_Part1_2Sum_groupBox");
		this.P1_Part1_2Sum_groupBox.Name = "P1_Part1_2Sum_groupBox";
		this.P1_Part1_2Sum_groupBox.TabStop = false;
		resources.ApplyResources(this.P1_Part1_2Sum_UseItem_CheckBox, "P1_Part1_2Sum_UseItem_CheckBox");
		this.P1_Part1_2Sum_UseItem_CheckBox.Name = "P1_Part1_2Sum_UseItem_CheckBox";
		this.P1_Part1_2Sum_UseItem_CheckBox.UseVisualStyleBackColor = true;
		this.P1_Part1_2Sum_UseItem_CheckBox.CheckedChanged += new System.EventHandler(P1_Part1_2Sum_UseItem_CheckBox_CheckedChanged);
		resources.ApplyResources(this.P1_P1_2SumFlag_numericUpDown, "P1_P1_2SumFlag_numericUpDown");
		this.P1_P1_2SumFlag_numericUpDown.Maximum = new decimal(new int[4] { 9999999, 0, 0, 0 });
		this.P1_P1_2SumFlag_numericUpDown.Name = "P1_P1_2SumFlag_numericUpDown";
		this.P1_P1_2SumFlag_numericUpDown.Value = new decimal(new int[4] { 2099999, 0, 0, 0 });
		this.P1_P1_2SumFlag_numericUpDown.ValueChanged += new System.EventHandler(P1_P1_2SumFlag_numericUpDown_ValueChanged);
		resources.ApplyResources(this.P1_P1_2_label, "P1_P1_2_label");
		this.P1_P1_2_label.Name = "P1_P1_2_label";
		this.P1_Part2_groupBox.Controls.Add(this.P1_P2Const_numericUpDown);
		this.P1_Part2_groupBox.Controls.Add(this.P1_P2Const_radioButton);
		this.P1_Part2_groupBox.Controls.Add(this.P1_P2PLUNumber_radioButton);
		this.P1_Part2_groupBox.Controls.Add(this.P1_P2ItemCode_radioButton);
		resources.ApplyResources(this.P1_Part2_groupBox, "P1_Part2_groupBox");
		this.P1_Part2_groupBox.Name = "P1_Part2_groupBox";
		this.P1_Part2_groupBox.TabStop = false;
		resources.ApplyResources(this.P1_P2Const_numericUpDown, "P1_P2Const_numericUpDown");
		this.P1_P2Const_numericUpDown.Maximum = new decimal(new int[4] { 99999, 0, 0, 0 });
		this.P1_P2Const_numericUpDown.Name = "P1_P2Const_numericUpDown";
		this.P1_P2Const_numericUpDown.ValueChanged += new System.EventHandler(P1_P2_ItemValue);
		resources.ApplyResources(this.P1_P2Const_radioButton, "P1_P2Const_radioButton");
		this.P1_P2Const_radioButton.Name = "P1_P2Const_radioButton";
		this.P1_P2Const_radioButton.UseVisualStyleBackColor = true;
		this.P1_P2Const_radioButton.CheckedChanged += new System.EventHandler(P1_P2_ItemValue);
		resources.ApplyResources(this.P1_P2PLUNumber_radioButton, "P1_P2PLUNumber_radioButton");
		this.P1_P2PLUNumber_radioButton.Name = "P1_P2PLUNumber_radioButton";
		this.P1_P2PLUNumber_radioButton.UseVisualStyleBackColor = true;
		this.P1_P2PLUNumber_radioButton.CheckedChanged += new System.EventHandler(P1_P2_ItemValue);
		resources.ApplyResources(this.P1_P2ItemCode_radioButton, "P1_P2ItemCode_radioButton");
		this.P1_P2ItemCode_radioButton.Name = "P1_P2ItemCode_radioButton";
		this.P1_P2ItemCode_radioButton.UseVisualStyleBackColor = true;
		this.P1_P2ItemCode_radioButton.CheckedChanged += new System.EventHandler(P1_P2_ItemValue);
		this.P1_Part5_groupBox.Controls.Add(this.P1_Check_C0_radioButton);
		this.P1_Part5_groupBox.Controls.Add(this.P1_Check_NS_radioButton);
		this.P1_Part5_groupBox.Controls.Add(this.P1_Check_S_radioButton);
		resources.ApplyResources(this.P1_Part5_groupBox, "P1_Part5_groupBox");
		this.P1_Part5_groupBox.Name = "P1_Part5_groupBox";
		this.P1_Part5_groupBox.TabStop = false;
		resources.ApplyResources(this.P1_Check_C0_radioButton, "P1_Check_C0_radioButton");
		this.P1_Check_C0_radioButton.Name = "P1_Check_C0_radioButton";
		this.P1_Check_C0_radioButton.UseVisualStyleBackColor = true;
		this.P1_Check_C0_radioButton.CheckedChanged += new System.EventHandler(P1_Px_CheckSum);
		resources.ApplyResources(this.P1_Check_NS_radioButton, "P1_Check_NS_radioButton");
		this.P1_Check_NS_radioButton.Name = "P1_Check_NS_radioButton";
		this.P1_Check_NS_radioButton.UseVisualStyleBackColor = true;
		this.P1_Check_NS_radioButton.CheckedChanged += new System.EventHandler(P1_Px_CheckSum);
		resources.ApplyResources(this.P1_Check_S_radioButton, "P1_Check_S_radioButton");
		this.P1_Check_S_radioButton.Checked = true;
		this.P1_Check_S_radioButton.Name = "P1_Check_S_radioButton";
		this.P1_Check_S_radioButton.TabStop = true;
		this.P1_Check_S_radioButton.UseVisualStyleBackColor = true;
		this.P1_Check_S_radioButton.CheckedChanged += new System.EventHandler(P1_Px_CheckSum);
		this.P1_Part1_groupBox.Controls.Add(this.P1_P1_ItemFlag_numericUpDown);
		this.P1_Part1_groupBox.Controls.Add(this.P1_P1_label);
		resources.ApplyResources(this.P1_Part1_groupBox, "P1_Part1_groupBox");
		this.P1_Part1_groupBox.Name = "P1_Part1_groupBox";
		this.P1_Part1_groupBox.TabStop = false;
		resources.ApplyResources(this.P1_P1_ItemFlag_numericUpDown, "P1_P1_ItemFlag_numericUpDown");
		this.P1_P1_ItemFlag_numericUpDown.Maximum = new decimal(new int[4] { 99, 0, 0, 0 });
		this.P1_P1_ItemFlag_numericUpDown.Name = "P1_P1_ItemFlag_numericUpDown";
		this.P1_P1_ItemFlag_numericUpDown.Value = new decimal(new int[4] { 20, 0, 0, 0 });
		this.P1_P1_ItemFlag_numericUpDown.ValueChanged += new System.EventHandler(P1_P1_ItemFlag_numericUpDown_ValueChanged);
		resources.ApplyResources(this.P1_P1_label, "P1_P1_label");
		this.P1_P1_label.Name = "P1_P1_label";
		this.P1_Part3_groupBox.Controls.Add(this.P1_P3Total_radioButton);
		this.P1_Part3_groupBox.Controls.Add(this.P1_P3Amount_radioButton);
		resources.ApplyResources(this.P1_Part3_groupBox, "P1_Part3_groupBox");
		this.P1_Part3_groupBox.Name = "P1_Part3_groupBox";
		this.P1_Part3_groupBox.TabStop = false;
		resources.ApplyResources(this.P1_P3Total_radioButton, "P1_P3Total_radioButton");
		this.P1_P3Total_radioButton.Name = "P1_P3Total_radioButton";
		this.P1_P3Total_radioButton.UseVisualStyleBackColor = true;
		this.P1_P3Total_radioButton.CheckedChanged += new System.EventHandler(P1_P3_ItemValue);
		resources.ApplyResources(this.P1_P3Amount_radioButton, "P1_P3Amount_radioButton");
		this.P1_P3Amount_radioButton.Name = "P1_P3Amount_radioButton";
		this.P1_P3Amount_radioButton.UseVisualStyleBackColor = true;
		this.P1_P3Amount_radioButton.CheckedChanged += new System.EventHandler(P1_P3_ItemValue);
		this.P1_Part4_groupBox.Controls.Add(this.P1_P4Total_radioButton);
		this.P1_Part4_groupBox.Controls.Add(this.P1_P4Amount_radioButton);
		resources.ApplyResources(this.P1_Part4_groupBox, "P1_Part4_groupBox");
		this.P1_Part4_groupBox.Name = "P1_Part4_groupBox";
		this.P1_Part4_groupBox.TabStop = false;
		resources.ApplyResources(this.P1_P4Total_radioButton, "P1_P4Total_radioButton");
		this.P1_P4Total_radioButton.Checked = true;
		this.P1_P4Total_radioButton.Name = "P1_P4Total_radioButton";
		this.P1_P4Total_radioButton.TabStop = true;
		this.P1_P4Total_radioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.P1_P4Amount_radioButton, "P1_P4Amount_radioButton");
		this.P1_P4Amount_radioButton.Name = "P1_P4Amount_radioButton";
		this.P1_P4Amount_radioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.barcode_Special_RadioButton, "barcode_Special_RadioButton");
		this.barcode_Special_RadioButton.Name = "barcode_Special_RadioButton";
		this.barcode_Special_RadioButton.TabStop = true;
		this.barcode_Special_RadioButton.UseVisualStyleBackColor = true;
		this.barcode_Special_RadioButton.CheckedChanged += new System.EventHandler(barcode_MainType_RadioButton_CheckedChanged);
		resources.ApplyResources(this.barcode_ManualEdit_Panel, "barcode_ManualEdit_Panel");
		this.barcode_ManualEdit_Panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.barcode_ManualEdit_Panel.Controls.Add(this.Group_Label);
		this.barcode_ManualEdit_Panel.Controls.Add(this.BarSub_TableLayoutPanel);
		this.barcode_ManualEdit_Panel.Controls.Add(this.BarNum_NumericUpDown);
		this.barcode_ManualEdit_Panel.Controls.Add(this.barcode_ManualEdit_CheckDigit_CheckBox);
		this.barcode_ManualEdit_Panel.Controls.Add(this.TChar_TextBox);
		this.barcode_ManualEdit_Panel.Controls.Add(this.barcode_ManualEdit_BType_ComboBox);
		this.barcode_ManualEdit_Panel.Controls.Add(this.barcode_ManualEdit_Type_Label);
		this.barcode_ManualEdit_Panel.Name = "barcode_ManualEdit_Panel";
		resources.ApplyResources(this.Group_Label, "Group_Label");
		this.Group_Label.Name = "Group_Label";
		resources.ApplyResources(this.BarSub_TableLayoutPanel, "BarSub_TableLayoutPanel");
		this.BarSub_TableLayoutPanel.Controls.Add(this.view_subpage_panel, 0, 0);
		this.BarSub_TableLayoutPanel.Controls.Add(this.Info_Panel, 0, 1);
		this.BarSub_TableLayoutPanel.Controls.Add(this.TE2_label, 0, 35);
		this.BarSub_TableLayoutPanel.Name = "BarSub_TableLayoutPanel";
		this.view_subpage_panel.Controls.Add(this.label4);
		this.view_subpage_panel.Controls.Add(this.label5);
		this.view_subpage_panel.Controls.Add(this.label6);
		resources.ApplyResources(this.view_subpage_panel, "view_subpage_panel");
		this.view_subpage_panel.Name = "view_subpage_panel";
		resources.ApplyResources(this.label4, "label4");
		this.label4.BackColor = System.Drawing.Color.Transparent;
		this.label4.Cursor = System.Windows.Forms.Cursors.Hand;
		this.label4.ForeColor = System.Drawing.Color.Firebrick;
		this.label4.Name = "label4";
		resources.ApplyResources(this.label5, "label5");
		this.label5.BackColor = System.Drawing.Color.Transparent;
		this.label5.ForeColor = System.Drawing.Color.Firebrick;
		this.label5.Name = "label5";
		resources.ApplyResources(this.label6, "label6");
		this.label6.BackColor = System.Drawing.Color.Transparent;
		this.label6.ForeColor = System.Drawing.Color.Firebrick;
		this.label6.Name = "label6";
		this.Info_Panel.Controls.Add(this.Version_Error_Label);
		resources.ApplyResources(this.Info_Panel, "Info_Panel");
		this.Info_Panel.Name = "Info_Panel";
		resources.ApplyResources(this.Version_Error_Label, "Version_Error_Label");
		this.Version_Error_Label.BackColor = System.Drawing.Color.Transparent;
		this.Version_Error_Label.ForeColor = System.Drawing.Color.Firebrick;
		this.Version_Error_Label.Name = "Version_Error_Label";
		resources.ApplyResources(this.TE2_label, "TE2_label");
		this.TE2_label.Name = "TE2_label";
		resources.ApplyResources(this.BarNum_NumericUpDown, "BarNum_NumericUpDown");
		this.BarNum_NumericUpDown.Maximum = new decimal(new int[4] { 32, 0, 0, 0 });
		this.BarNum_NumericUpDown.Minimum = new decimal(new int[4] { 6, 0, 0, 0 });
		this.BarNum_NumericUpDown.Name = "BarNum_NumericUpDown";
		this.BarNum_NumericUpDown.Value = new decimal(new int[4] { 6, 0, 0, 0 });
		this.BarNum_NumericUpDown.ValueChanged += new System.EventHandler(BarNum_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.barcode_ManualEdit_CheckDigit_CheckBox, "barcode_ManualEdit_CheckDigit_CheckBox");
		this.barcode_ManualEdit_CheckDigit_CheckBox.Name = "barcode_ManualEdit_CheckDigit_CheckBox";
		this.barcode_ManualEdit_CheckDigit_CheckBox.UseVisualStyleBackColor = true;
		this.barcode_ManualEdit_CheckDigit_CheckBox.CheckedChanged += new System.EventHandler(barcode_ManualEdit_CheckDigit_CheckBox_CheckedChanged);
		resources.ApplyResources(this.TChar_TextBox, "TChar_TextBox");
		this.TChar_TextBox.Name = "TChar_TextBox";
		this.barcode_ManualEdit_BType_ComboBox.DataSource = this.barcodeFormat2BindingSource;
		this.barcode_ManualEdit_BType_ComboBox.DisplayMember = "Display";
		this.barcode_ManualEdit_BType_ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.barcode_ManualEdit_BType_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.barcode_ManualEdit_BType_ComboBox, "barcode_ManualEdit_BType_ComboBox");
		this.barcode_ManualEdit_BType_ComboBox.Name = "barcode_ManualEdit_BType_ComboBox";
		this.barcode_ManualEdit_BType_ComboBox.ValueMember = "Value";
		this.barcode_ManualEdit_BType_ComboBox.SelectedIndexChanged += new System.EventHandler(barcode_ManualEdit_BType_ComboBox_SelectedIndexChanged);
		this.barcodeFormat2BindingSource.DataMember = "Barcode_Format";
		this.barcodeFormat2BindingSource.DataSource = this.uIDataSet;
		this.barcodeFormat2BindingSource.Sort = "Value";
		resources.ApplyResources(this.barcode_ManualEdit_Type_Label, "barcode_ManualEdit_Type_Label");
		this.barcode_ManualEdit_Type_Label.Name = "barcode_ManualEdit_Type_Label";
		resources.ApplyResources(this.barcode_ManualEdit_RadioButton, "barcode_ManualEdit_RadioButton");
		this.barcode_ManualEdit_RadioButton.Name = "barcode_ManualEdit_RadioButton";
		this.barcode_ManualEdit_RadioButton.TabStop = true;
		this.barcode_ManualEdit_RadioButton.UseVisualStyleBackColor = true;
		this.barcode_ManualEdit_RadioButton.CheckedChanged += new System.EventHandler(barcode_MainType_RadioButton_CheckedChanged);
		this.device_Panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.device_Panel.Controls.Add(this.Device_F_Label);
		this.device_Panel.Controls.Add(this.Device_F_RadioButton);
		this.device_Panel.Controls.Add(this.Device_A17_Label);
		this.device_Panel.Controls.Add(this.Device_D_Label);
		this.device_Panel.Controls.Add(this.Device_E_Label);
		this.device_Panel.Controls.Add(this.Device_A08_Label);
		this.device_Panel.Controls.Add(this.Device_B_Label);
		this.device_Panel.Controls.Add(this.Device_A12_Label);
		this.device_Panel.Controls.Add(this.Device_C11_Label);
		this.device_Panel.Controls.Add(this.Device_C15_Label);
		this.device_Panel.Controls.Add(this.devicePictureBox);
		this.device_Panel.Controls.Add(this.Device_E_RadioButton);
		this.device_Panel.Controls.Add(this.Device_B_RadioButton);
		this.device_Panel.Controls.Add(this.Device_D_RadioButton);
		this.device_Panel.Controls.Add(this.Device_C_RadioButton);
		this.device_Panel.Controls.Add(this.Device_A_RadioButton);
		this.device_Panel.Controls.Add(this.Device_Cxx_Display_Panel);
		this.device_Panel.Controls.Add(this.Device_Axx_Display_Panel);
		this.device_Panel.Controls.Add(this.Device_Cxx_Panel);
		this.device_Panel.Controls.Add(this.Device_Axx_Panel);
		this.device_Panel.Controls.Add(this.Device_A15_Label);
		resources.ApplyResources(this.device_Panel, "device_Panel");
		this.device_Panel.Name = "device_Panel";
		resources.ApplyResources(this.Device_F_Label, "Device_F_Label");
		this.Device_F_Label.Name = "Device_F_Label";
		resources.ApplyResources(this.Device_F_RadioButton, "Device_F_RadioButton");
		this.Device_F_RadioButton.Name = "Device_F_RadioButton";
		this.Device_F_RadioButton.TabStop = true;
		this.Device_F_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Device_A17_Label, "Device_A17_Label");
		this.Device_A17_Label.Name = "Device_A17_Label";
		resources.ApplyResources(this.Device_D_Label, "Device_D_Label");
		this.Device_D_Label.Name = "Device_D_Label";
		resources.ApplyResources(this.Device_E_Label, "Device_E_Label");
		this.Device_E_Label.Name = "Device_E_Label";
		resources.ApplyResources(this.Device_A08_Label, "Device_A08_Label");
		this.Device_A08_Label.Name = "Device_A08_Label";
		resources.ApplyResources(this.Device_B_Label, "Device_B_Label");
		this.Device_B_Label.Name = "Device_B_Label";
		resources.ApplyResources(this.Device_A12_Label, "Device_A12_Label");
		this.Device_A12_Label.Name = "Device_A12_Label";
		resources.ApplyResources(this.Device_C11_Label, "Device_C11_Label");
		this.Device_C11_Label.Name = "Device_C11_Label";
		resources.ApplyResources(this.Device_C15_Label, "Device_C15_Label");
		this.Device_C15_Label.Name = "Device_C15_Label";
		resources.ApplyResources(this.devicePictureBox, "devicePictureBox");
		this.devicePictureBox.Name = "devicePictureBox";
		this.devicePictureBox.TabStop = false;
		resources.ApplyResources(this.Device_E_RadioButton, "Device_E_RadioButton");
		this.Device_E_RadioButton.Name = "Device_E_RadioButton";
		this.Device_E_RadioButton.TabStop = true;
		this.Device_E_RadioButton.UseVisualStyleBackColor = true;
		this.Device_E_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		resources.ApplyResources(this.Device_B_RadioButton, "Device_B_RadioButton");
		this.Device_B_RadioButton.Name = "Device_B_RadioButton";
		this.Device_B_RadioButton.TabStop = true;
		this.Device_B_RadioButton.UseVisualStyleBackColor = true;
		this.Device_B_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		resources.ApplyResources(this.Device_D_RadioButton, "Device_D_RadioButton");
		this.Device_D_RadioButton.Name = "Device_D_RadioButton";
		this.Device_D_RadioButton.TabStop = true;
		this.Device_D_RadioButton.UseVisualStyleBackColor = true;
		this.Device_D_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		resources.ApplyResources(this.Device_C_RadioButton, "Device_C_RadioButton");
		this.Device_C_RadioButton.Name = "Device_C_RadioButton";
		this.Device_C_RadioButton.TabStop = true;
		this.Device_C_RadioButton.UseVisualStyleBackColor = true;
		this.Device_C_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		resources.ApplyResources(this.Device_A_RadioButton, "Device_A_RadioButton");
		this.Device_A_RadioButton.Name = "Device_A_RadioButton";
		this.Device_A_RadioButton.TabStop = true;
		this.Device_A_RadioButton.UseVisualStyleBackColor = true;
		this.Device_A_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		this.Device_Cxx_Display_Panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.Device_Cxx_Display_Panel.Controls.Add(this.Device_Cxx_5w_RadioButton);
		this.Device_Cxx_Display_Panel.Controls.Add(this.Device_Cxx_4w_RadioButton);
		resources.ApplyResources(this.Device_Cxx_Display_Panel, "Device_Cxx_Display_Panel");
		this.Device_Cxx_Display_Panel.Name = "Device_Cxx_Display_Panel";
		resources.ApplyResources(this.Device_Cxx_5w_RadioButton, "Device_Cxx_5w_RadioButton");
		this.Device_Cxx_5w_RadioButton.Name = "Device_Cxx_5w_RadioButton";
		this.Device_Cxx_5w_RadioButton.TabStop = true;
		this.Device_Cxx_5w_RadioButton.UseVisualStyleBackColor = true;
		this.Device_Cxx_5w_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		resources.ApplyResources(this.Device_Cxx_4w_RadioButton, "Device_Cxx_4w_RadioButton");
		this.Device_Cxx_4w_RadioButton.Name = "Device_Cxx_4w_RadioButton";
		this.Device_Cxx_4w_RadioButton.TabStop = true;
		this.Device_Cxx_4w_RadioButton.UseVisualStyleBackColor = true;
		this.Device_Cxx_4w_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		this.Device_Axx_Display_Panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.Device_Axx_Display_Panel.Controls.Add(this.Device_Axx_np_RadioButton);
		this.Device_Axx_Display_Panel.Controls.Add(this.Device_Axx_5w_RadioButton);
		this.Device_Axx_Display_Panel.Controls.Add(this.Device_Axx_4w_RadioButton);
		resources.ApplyResources(this.Device_Axx_Display_Panel, "Device_Axx_Display_Panel");
		this.Device_Axx_Display_Panel.Name = "Device_Axx_Display_Panel";
		resources.ApplyResources(this.Device_Axx_np_RadioButton, "Device_Axx_np_RadioButton");
		this.Device_Axx_np_RadioButton.Name = "Device_Axx_np_RadioButton";
		this.Device_Axx_np_RadioButton.TabStop = true;
		this.Device_Axx_np_RadioButton.UseVisualStyleBackColor = true;
		this.Device_Axx_np_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		resources.ApplyResources(this.Device_Axx_5w_RadioButton, "Device_Axx_5w_RadioButton");
		this.Device_Axx_5w_RadioButton.Name = "Device_Axx_5w_RadioButton";
		this.Device_Axx_5w_RadioButton.TabStop = true;
		this.Device_Axx_5w_RadioButton.UseVisualStyleBackColor = true;
		this.Device_Axx_5w_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		resources.ApplyResources(this.Device_Axx_4w_RadioButton, "Device_Axx_4w_RadioButton");
		this.Device_Axx_4w_RadioButton.Name = "Device_Axx_4w_RadioButton";
		this.Device_Axx_4w_RadioButton.TabStop = true;
		this.Device_Axx_4w_RadioButton.UseVisualStyleBackColor = true;
		this.Device_Axx_4w_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		this.Device_Cxx_Panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.Device_Cxx_Panel.Controls.Add(this.Device_C11_RadioButton);
		this.Device_Cxx_Panel.Controls.Add(this.Device_C15_RadioButton);
		resources.ApplyResources(this.Device_Cxx_Panel, "Device_Cxx_Panel");
		this.Device_Cxx_Panel.Name = "Device_Cxx_Panel";
		resources.ApplyResources(this.Device_C11_RadioButton, "Device_C11_RadioButton");
		this.Device_C11_RadioButton.Name = "Device_C11_RadioButton";
		this.Device_C11_RadioButton.TabStop = true;
		this.Device_C11_RadioButton.UseVisualStyleBackColor = true;
		this.Device_C11_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		resources.ApplyResources(this.Device_C15_RadioButton, "Device_C15_RadioButton");
		this.Device_C15_RadioButton.Name = "Device_C15_RadioButton";
		this.Device_C15_RadioButton.TabStop = true;
		this.Device_C15_RadioButton.UseVisualStyleBackColor = true;
		this.Device_C15_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		this.Device_Axx_Panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.Device_Axx_Panel.Controls.Add(this.Device_A17_RadioButton);
		this.Device_Axx_Panel.Controls.Add(this.Device_A15_RadioButton);
		this.Device_Axx_Panel.Controls.Add(this.Device_A08_RadioButton);
		this.Device_Axx_Panel.Controls.Add(this.Device_A12_RadioButton);
		resources.ApplyResources(this.Device_Axx_Panel, "Device_Axx_Panel");
		this.Device_Axx_Panel.Name = "Device_Axx_Panel";
		resources.ApplyResources(this.Device_A17_RadioButton, "Device_A17_RadioButton");
		this.Device_A17_RadioButton.Name = "Device_A17_RadioButton";
		this.Device_A17_RadioButton.TabStop = true;
		this.Device_A17_RadioButton.UseVisualStyleBackColor = true;
		this.Device_A17_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		resources.ApplyResources(this.Device_A15_RadioButton, "Device_A15_RadioButton");
		this.Device_A15_RadioButton.Name = "Device_A15_RadioButton";
		this.Device_A15_RadioButton.TabStop = true;
		this.Device_A15_RadioButton.UseVisualStyleBackColor = true;
		this.Device_A15_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		resources.ApplyResources(this.Device_A08_RadioButton, "Device_A08_RadioButton");
		this.Device_A08_RadioButton.Name = "Device_A08_RadioButton";
		this.Device_A08_RadioButton.TabStop = true;
		this.Device_A08_RadioButton.UseVisualStyleBackColor = true;
		this.Device_A08_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		resources.ApplyResources(this.Device_A12_RadioButton, "Device_A12_RadioButton");
		this.Device_A12_RadioButton.Name = "Device_A12_RadioButton";
		this.Device_A12_RadioButton.TabStop = true;
		this.Device_A12_RadioButton.UseVisualStyleBackColor = true;
		this.Device_A12_RadioButton.CheckedChanged += new System.EventHandler(Device_Changed);
		resources.ApplyResources(this.Device_A15_Label, "Device_A15_Label");
		this.Device_A15_Label.Name = "Device_A15_Label";
		resources.ApplyResources(this.manage_panel, "manage_panel");
		this.manage_panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.manage_panel.Controls.Add(this.MG_CustomRight_RadioButton);
		this.manage_panel.Controls.Add(this.MG_NoRight_RadioButton);
		this.manage_panel.Controls.Add(this.MG_LimitedRight_RadioButton);
		this.manage_panel.Controls.Add(this.MG_FullRight_RadioButton);
		this.manage_panel.Controls.Add(this.mg_Detail_Panel);
		this.manage_panel.Name = "manage_panel";
		resources.ApplyResources(this.MG_CustomRight_RadioButton, "MG_CustomRight_RadioButton");
		this.MG_CustomRight_RadioButton.Name = "MG_CustomRight_RadioButton";
		this.MG_CustomRight_RadioButton.UseVisualStyleBackColor = true;
		this.MG_CustomRight_RadioButton.CheckedChanged += new System.EventHandler(MG_xxxRight_RadioButton_CheckChanged);
		resources.ApplyResources(this.MG_NoRight_RadioButton, "MG_NoRight_RadioButton");
		this.MG_NoRight_RadioButton.Name = "MG_NoRight_RadioButton";
		this.MG_NoRight_RadioButton.UseVisualStyleBackColor = true;
		this.MG_NoRight_RadioButton.CheckedChanged += new System.EventHandler(MG_xxxRight_RadioButton_CheckChanged);
		resources.ApplyResources(this.MG_LimitedRight_RadioButton, "MG_LimitedRight_RadioButton");
		this.MG_LimitedRight_RadioButton.Name = "MG_LimitedRight_RadioButton";
		this.MG_LimitedRight_RadioButton.UseVisualStyleBackColor = true;
		this.MG_LimitedRight_RadioButton.CheckedChanged += new System.EventHandler(MG_xxxRight_RadioButton_CheckChanged);
		resources.ApplyResources(this.MG_FullRight_RadioButton, "MG_FullRight_RadioButton");
		this.MG_FullRight_RadioButton.Name = "MG_FullRight_RadioButton";
		this.MG_FullRight_RadioButton.UseVisualStyleBackColor = true;
		this.MG_FullRight_RadioButton.CheckedChanged += new System.EventHandler(MG_xxxRight_RadioButton_CheckChanged);
		this.mg_Detail_Panel.Controls.Add(this.P5_ZeroBack_groupBox);
		this.mg_Detail_Panel.Controls.Add(this.P5_Unconfirmed_groupBox);
		this.mg_Detail_Panel.Controls.Add(this.P5_VBuffer_groupBox);
		this.mg_Detail_Panel.Controls.Add(this.P5_TotalPrice_groupBox);
		this.mg_Detail_Panel.Controls.Add(this.mg_AdminIC_groupBox);
		this.mg_Detail_Panel.Controls.Add(this.P5_UnitPrice_groupBox);
		this.mg_Detail_Panel.Controls.Add(this.P5_Other_groupBox);
		this.mg_Detail_Panel.Controls.Add(this.mg_Password_groupBox);
		resources.ApplyResources(this.mg_Detail_Panel, "mg_Detail_Panel");
		this.mg_Detail_Panel.Name = "mg_Detail_Panel";
		this.P5_ZeroBack_groupBox.Controls.Add(this.P5_ZeroBack_3_radioButton);
		this.P5_ZeroBack_groupBox.Controls.Add(this.P5_ZeroBack_1_radioButton);
		this.P5_ZeroBack_groupBox.Controls.Add(this.P5_ZeroBack_0_radioButton);
		this.P5_ZeroBack_groupBox.Controls.Add(this.P5_ZeroBack_4_radioButton);
		this.P5_ZeroBack_groupBox.Controls.Add(this.P5_ZeroBack_2_radioButton);
		resources.ApplyResources(this.P5_ZeroBack_groupBox, "P5_ZeroBack_groupBox");
		this.P5_ZeroBack_groupBox.Name = "P5_ZeroBack_groupBox";
		this.P5_ZeroBack_groupBox.TabStop = false;
		resources.ApplyResources(this.P5_ZeroBack_3_radioButton, "P5_ZeroBack_3_radioButton");
		this.P5_ZeroBack_3_radioButton.Name = "P5_ZeroBack_3_radioButton";
		this.P5_ZeroBack_3_radioButton.UseVisualStyleBackColor = true;
		this.P5_ZeroBack_3_radioButton.CheckedChanged += new System.EventHandler(P5_ZeroBack_x_radioButton_CheckChanged);
		resources.ApplyResources(this.P5_ZeroBack_1_radioButton, "P5_ZeroBack_1_radioButton");
		this.P5_ZeroBack_1_radioButton.Name = "P5_ZeroBack_1_radioButton";
		this.P5_ZeroBack_1_radioButton.UseVisualStyleBackColor = true;
		this.P5_ZeroBack_1_radioButton.CheckedChanged += new System.EventHandler(P5_ZeroBack_x_radioButton_CheckChanged);
		resources.ApplyResources(this.P5_ZeroBack_0_radioButton, "P5_ZeroBack_0_radioButton");
		this.P5_ZeroBack_0_radioButton.Name = "P5_ZeroBack_0_radioButton";
		this.P5_ZeroBack_0_radioButton.UseVisualStyleBackColor = true;
		this.P5_ZeroBack_0_radioButton.CheckedChanged += new System.EventHandler(P5_ZeroBack_x_radioButton_CheckChanged);
		resources.ApplyResources(this.P5_ZeroBack_4_radioButton, "P5_ZeroBack_4_radioButton");
		this.P5_ZeroBack_4_radioButton.Name = "P5_ZeroBack_4_radioButton";
		this.P5_ZeroBack_4_radioButton.UseVisualStyleBackColor = true;
		this.P5_ZeroBack_4_radioButton.CheckedChanged += new System.EventHandler(P5_ZeroBack_x_radioButton_CheckChanged);
		resources.ApplyResources(this.P5_ZeroBack_2_radioButton, "P5_ZeroBack_2_radioButton");
		this.P5_ZeroBack_2_radioButton.Name = "P5_ZeroBack_2_radioButton";
		this.P5_ZeroBack_2_radioButton.UseVisualStyleBackColor = true;
		this.P5_ZeroBack_2_radioButton.CheckedChanged += new System.EventHandler(P5_ZeroBack_x_radioButton_CheckChanged);
		this.P5_Unconfirmed_groupBox.Controls.Add(this.P5_Unconfirmed_1_radioButton);
		this.P5_Unconfirmed_groupBox.Controls.Add(this.P5_Unconfirmed_0_radioButton);
		this.P5_Unconfirmed_groupBox.Controls.Add(this.P5_Unconfirmed_2_radioButton);
		resources.ApplyResources(this.P5_Unconfirmed_groupBox, "P5_Unconfirmed_groupBox");
		this.P5_Unconfirmed_groupBox.Name = "P5_Unconfirmed_groupBox";
		this.P5_Unconfirmed_groupBox.TabStop = false;
		resources.ApplyResources(this.P5_Unconfirmed_1_radioButton, "P5_Unconfirmed_1_radioButton");
		this.P5_Unconfirmed_1_radioButton.Name = "P5_Unconfirmed_1_radioButton";
		this.P5_Unconfirmed_1_radioButton.UseVisualStyleBackColor = true;
		this.P5_Unconfirmed_1_radioButton.CheckedChanged += new System.EventHandler(P5_Unconfirmed_x_radioButton_CheckChanged);
		resources.ApplyResources(this.P5_Unconfirmed_0_radioButton, "P5_Unconfirmed_0_radioButton");
		this.P5_Unconfirmed_0_radioButton.Name = "P5_Unconfirmed_0_radioButton";
		this.P5_Unconfirmed_0_radioButton.UseVisualStyleBackColor = true;
		this.P5_Unconfirmed_0_radioButton.CheckedChanged += new System.EventHandler(P5_Unconfirmed_x_radioButton_CheckChanged);
		resources.ApplyResources(this.P5_Unconfirmed_2_radioButton, "P5_Unconfirmed_2_radioButton");
		this.P5_Unconfirmed_2_radioButton.Name = "P5_Unconfirmed_2_radioButton";
		this.P5_Unconfirmed_2_radioButton.UseVisualStyleBackColor = true;
		this.P5_Unconfirmed_2_radioButton.CheckedChanged += new System.EventHandler(P5_Unconfirmed_x_radioButton_CheckChanged);
		this.P5_VBuffer_groupBox.Controls.Add(this.P5_VBuffer_3_radioButton);
		this.P5_VBuffer_groupBox.Controls.Add(this.P5_VBuffer_0_radioButton);
		this.P5_VBuffer_groupBox.Controls.Add(this.P5_VBuffer_1_radioButton);
		this.P5_VBuffer_groupBox.Controls.Add(this.P5_VBuffer_4_radioButton);
		this.P5_VBuffer_groupBox.Controls.Add(this.P5_VBuffer_2_radioButton);
		resources.ApplyResources(this.P5_VBuffer_groupBox, "P5_VBuffer_groupBox");
		this.P5_VBuffer_groupBox.Name = "P5_VBuffer_groupBox";
		this.P5_VBuffer_groupBox.TabStop = false;
		resources.ApplyResources(this.P5_VBuffer_3_radioButton, "P5_VBuffer_3_radioButton");
		this.P5_VBuffer_3_radioButton.Name = "P5_VBuffer_3_radioButton";
		this.P5_VBuffer_3_radioButton.UseVisualStyleBackColor = true;
		this.P5_VBuffer_3_radioButton.CheckedChanged += new System.EventHandler(P5_VBuffer_x_radioButton_CheckChanged);
		resources.ApplyResources(this.P5_VBuffer_0_radioButton, "P5_VBuffer_0_radioButton");
		this.P5_VBuffer_0_radioButton.Name = "P5_VBuffer_0_radioButton";
		this.P5_VBuffer_0_radioButton.UseVisualStyleBackColor = true;
		this.P5_VBuffer_0_radioButton.CheckedChanged += new System.EventHandler(P5_VBuffer_x_radioButton_CheckChanged);
		resources.ApplyResources(this.P5_VBuffer_1_radioButton, "P5_VBuffer_1_radioButton");
		this.P5_VBuffer_1_radioButton.Name = "P5_VBuffer_1_radioButton";
		this.P5_VBuffer_1_radioButton.UseVisualStyleBackColor = true;
		this.P5_VBuffer_1_radioButton.CheckedChanged += new System.EventHandler(P5_VBuffer_x_radioButton_CheckChanged);
		resources.ApplyResources(this.P5_VBuffer_4_radioButton, "P5_VBuffer_4_radioButton");
		this.P5_VBuffer_4_radioButton.Name = "P5_VBuffer_4_radioButton";
		this.P5_VBuffer_4_radioButton.UseVisualStyleBackColor = true;
		this.P5_VBuffer_4_radioButton.CheckedChanged += new System.EventHandler(P5_VBuffer_x_radioButton_CheckChanged);
		resources.ApplyResources(this.P5_VBuffer_2_radioButton, "P5_VBuffer_2_radioButton");
		this.P5_VBuffer_2_radioButton.Name = "P5_VBuffer_2_radioButton";
		this.P5_VBuffer_2_radioButton.UseVisualStyleBackColor = true;
		this.P5_VBuffer_2_radioButton.CheckedChanged += new System.EventHandler(P5_VBuffer_x_radioButton_CheckChanged);
		this.P5_TotalPrice_groupBox.Controls.Add(this.P5_TotalPrice_Allowed_radioButton);
		this.P5_TotalPrice_groupBox.Controls.Add(this.P5_TotalPrice_Forbidden_radioButton);
		resources.ApplyResources(this.P5_TotalPrice_groupBox, "P5_TotalPrice_groupBox");
		this.P5_TotalPrice_groupBox.Name = "P5_TotalPrice_groupBox";
		this.P5_TotalPrice_groupBox.TabStop = false;
		resources.ApplyResources(this.P5_TotalPrice_Allowed_radioButton, "P5_TotalPrice_Allowed_radioButton");
		this.P5_TotalPrice_Allowed_radioButton.Name = "P5_TotalPrice_Allowed_radioButton";
		this.P5_TotalPrice_Allowed_radioButton.UseVisualStyleBackColor = true;
		this.P5_TotalPrice_Allowed_radioButton.CheckedChanged += new System.EventHandler(P5_GrandTotal_State_radioButton_CheckedChanged);
		resources.ApplyResources(this.P5_TotalPrice_Forbidden_radioButton, "P5_TotalPrice_Forbidden_radioButton");
		this.P5_TotalPrice_Forbidden_radioButton.Name = "P5_TotalPrice_Forbidden_radioButton";
		this.P5_TotalPrice_Forbidden_radioButton.UseVisualStyleBackColor = true;
		this.P5_TotalPrice_Forbidden_radioButton.CheckedChanged += new System.EventHandler(P5_GrandTotal_State_radioButton_CheckedChanged);
		this.mg_AdminIC_groupBox.Controls.Add(this.BuyBack_CheckBox);
		this.mg_AdminIC_groupBox.Controls.Add(this.FProgPrice_CheckBox);
		this.mg_AdminIC_groupBox.Controls.Add(this.TSaleWT_CheckBox);
		this.mg_AdminIC_groupBox.Controls.Add(this.TSaleCT_CheckBox);
		this.mg_AdminIC_groupBox.Controls.Add(this.Preprint_CheckBox);
		this.mg_AdminIC_groupBox.Controls.Add(this.Reprint_CheckBox);
		this.mg_AdminIC_groupBox.Controls.Add(this.HangupRead_CheckBox);
		this.mg_AdminIC_groupBox.Controls.Add(this.HangupWrite_CheckBox);
		this.mg_AdminIC_groupBox.Controls.Add(this.Drawer_CheckBox);
		this.mg_AdminIC_groupBox.Controls.Add(this.Amend_CheckBox);
		this.mg_AdminIC_groupBox.Controls.Add(this.ItemQuit_CheckBox);
		this.mg_AdminIC_groupBox.Controls.Add(this.IllegalReboot_CheckBox);
		resources.ApplyResources(this.mg_AdminIC_groupBox, "mg_AdminIC_groupBox");
		this.mg_AdminIC_groupBox.Name = "mg_AdminIC_groupBox";
		this.mg_AdminIC_groupBox.TabStop = false;
		resources.ApplyResources(this.BuyBack_CheckBox, "BuyBack_CheckBox");
		this.BuyBack_CheckBox.Name = "BuyBack_CheckBox";
		this.BuyBack_CheckBox.UseVisualStyleBackColor = true;
		this.BuyBack_CheckBox.CheckedChanged += new System.EventHandler(adminInCharge_CheckChanged);
		resources.ApplyResources(this.FProgPrice_CheckBox, "FProgPrice_CheckBox");
		this.FProgPrice_CheckBox.Name = "FProgPrice_CheckBox";
		this.FProgPrice_CheckBox.UseVisualStyleBackColor = true;
		this.FProgPrice_CheckBox.CheckedChanged += new System.EventHandler(adminInCharge_CheckChanged);
		resources.ApplyResources(this.TSaleWT_CheckBox, "TSaleWT_CheckBox");
		this.TSaleWT_CheckBox.Name = "TSaleWT_CheckBox";
		this.TSaleWT_CheckBox.UseVisualStyleBackColor = true;
		this.TSaleWT_CheckBox.CheckedChanged += new System.EventHandler(adminInCharge_CheckChanged);
		resources.ApplyResources(this.TSaleCT_CheckBox, "TSaleCT_CheckBox");
		this.TSaleCT_CheckBox.Name = "TSaleCT_CheckBox";
		this.TSaleCT_CheckBox.UseVisualStyleBackColor = true;
		this.TSaleCT_CheckBox.CheckedChanged += new System.EventHandler(adminInCharge_CheckChanged);
		resources.ApplyResources(this.Preprint_CheckBox, "Preprint_CheckBox");
		this.Preprint_CheckBox.Name = "Preprint_CheckBox";
		this.Preprint_CheckBox.UseVisualStyleBackColor = true;
		this.Preprint_CheckBox.CheckedChanged += new System.EventHandler(adminInCharge_CheckChanged);
		resources.ApplyResources(this.Reprint_CheckBox, "Reprint_CheckBox");
		this.Reprint_CheckBox.Name = "Reprint_CheckBox";
		this.Reprint_CheckBox.UseVisualStyleBackColor = true;
		this.Reprint_CheckBox.CheckedChanged += new System.EventHandler(adminInCharge_CheckChanged);
		resources.ApplyResources(this.HangupRead_CheckBox, "HangupRead_CheckBox");
		this.HangupRead_CheckBox.Name = "HangupRead_CheckBox";
		this.HangupRead_CheckBox.UseVisualStyleBackColor = true;
		this.HangupRead_CheckBox.CheckedChanged += new System.EventHandler(adminInCharge_CheckChanged);
		resources.ApplyResources(this.HangupWrite_CheckBox, "HangupWrite_CheckBox");
		this.HangupWrite_CheckBox.Name = "HangupWrite_CheckBox";
		this.HangupWrite_CheckBox.UseVisualStyleBackColor = true;
		this.HangupWrite_CheckBox.CheckedChanged += new System.EventHandler(adminInCharge_CheckChanged);
		resources.ApplyResources(this.Drawer_CheckBox, "Drawer_CheckBox");
		this.Drawer_CheckBox.Name = "Drawer_CheckBox";
		this.Drawer_CheckBox.UseVisualStyleBackColor = true;
		this.Drawer_CheckBox.CheckedChanged += new System.EventHandler(adminInCharge_CheckChanged);
		resources.ApplyResources(this.Amend_CheckBox, "Amend_CheckBox");
		this.Amend_CheckBox.Name = "Amend_CheckBox";
		this.Amend_CheckBox.UseVisualStyleBackColor = true;
		this.Amend_CheckBox.CheckedChanged += new System.EventHandler(adminInCharge_CheckChanged);
		resources.ApplyResources(this.ItemQuit_CheckBox, "ItemQuit_CheckBox");
		this.ItemQuit_CheckBox.Name = "ItemQuit_CheckBox";
		this.ItemQuit_CheckBox.UseVisualStyleBackColor = true;
		this.ItemQuit_CheckBox.CheckedChanged += new System.EventHandler(adminInCharge_CheckChanged);
		resources.ApplyResources(this.IllegalReboot_CheckBox, "IllegalReboot_CheckBox");
		this.IllegalReboot_CheckBox.Name = "IllegalReboot_CheckBox";
		this.IllegalReboot_CheckBox.UseVisualStyleBackColor = true;
		this.IllegalReboot_CheckBox.CheckedChanged += new System.EventHandler(adminInCharge_CheckChanged);
		this.P5_UnitPrice_groupBox.Controls.Add(this.P5_UnitPrice_Allowed_radioButton);
		this.P5_UnitPrice_groupBox.Controls.Add(this.P5_UnitPrice_Forbidden_radioButton);
		resources.ApplyResources(this.P5_UnitPrice_groupBox, "P5_UnitPrice_groupBox");
		this.P5_UnitPrice_groupBox.Name = "P5_UnitPrice_groupBox";
		this.P5_UnitPrice_groupBox.TabStop = false;
		resources.ApplyResources(this.P5_UnitPrice_Allowed_radioButton, "P5_UnitPrice_Allowed_radioButton");
		this.P5_UnitPrice_Allowed_radioButton.Name = "P5_UnitPrice_Allowed_radioButton";
		this.P5_UnitPrice_Allowed_radioButton.UseVisualStyleBackColor = true;
		this.P5_UnitPrice_Allowed_radioButton.CheckedChanged += new System.EventHandler(P5_UnitPrice_State_radioButton_CheckedChanged);
		resources.ApplyResources(this.P5_UnitPrice_Forbidden_radioButton, "P5_UnitPrice_Forbidden_radioButton");
		this.P5_UnitPrice_Forbidden_radioButton.Name = "P5_UnitPrice_Forbidden_radioButton";
		this.P5_UnitPrice_Forbidden_radioButton.UseVisualStyleBackColor = true;
		this.P5_UnitPrice_Forbidden_radioButton.CheckedChanged += new System.EventHandler(P5_UnitPrice_State_radioButton_CheckedChanged);
		this.P5_Other_groupBox.Controls.Add(this.P5_Other_USBboot_checkBox);
		this.P5_Other_groupBox.Controls.Add(this.P5_Other_scPLUFProg_checkBox);
		this.P5_Other_groupBox.Controls.Add(this.P5_Other_PLUFProg_checkBox);
		this.P5_Other_groupBox.Controls.Add(this.P5_Other_SpecFProg_checkBox);
		resources.ApplyResources(this.P5_Other_groupBox, "P5_Other_groupBox");
		this.P5_Other_groupBox.Name = "P5_Other_groupBox";
		this.P5_Other_groupBox.TabStop = false;
		resources.ApplyResources(this.P5_Other_USBboot_checkBox, "P5_Other_USBboot_checkBox");
		this.P5_Other_USBboot_checkBox.Name = "P5_Other_USBboot_checkBox";
		this.P5_Other_USBboot_checkBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.P5_Other_scPLUFProg_checkBox, "P5_Other_scPLUFProg_checkBox");
		this.P5_Other_scPLUFProg_checkBox.Name = "P5_Other_scPLUFProg_checkBox";
		this.P5_Other_scPLUFProg_checkBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.P5_Other_PLUFProg_checkBox, "P5_Other_PLUFProg_checkBox");
		this.P5_Other_PLUFProg_checkBox.Name = "P5_Other_PLUFProg_checkBox";
		this.P5_Other_PLUFProg_checkBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.P5_Other_SpecFProg_checkBox, "P5_Other_SpecFProg_checkBox");
		this.P5_Other_SpecFProg_checkBox.Name = "P5_Other_SpecFProg_checkBox";
		this.P5_Other_SpecFProg_checkBox.UseVisualStyleBackColor = true;
		this.mg_Password_groupBox.Controls.Add(this.P5_AM_PriceFProg_textBox);
		this.mg_Password_groupBox.Controls.Add(this.P5_AM_Drawer_textBox);
		this.mg_Password_groupBox.Controls.Add(this.P5_AM_Account_textBox);
		this.mg_Password_groupBox.Controls.Add(this.P5_AM_Prog_textBox);
		this.mg_Password_groupBox.Controls.Add(this.P5_AM_Sale_textBox);
		this.mg_Password_groupBox.Controls.Add(this.P5_AM_Admin_textBox);
		this.mg_Password_groupBox.Controls.Add(this.P5_AM_PriceFProg_checkBox);
		this.mg_Password_groupBox.Controls.Add(this.P5_AM_Drawer_checkBox);
		this.mg_Password_groupBox.Controls.Add(this.P5_AM_Account_checkBox);
		this.mg_Password_groupBox.Controls.Add(this.P5_AM_Prog_checkBox);
		this.mg_Password_groupBox.Controls.Add(this.P5_AM_Admin_checkBox);
		this.mg_Password_groupBox.Controls.Add(this.P5_AM_Sale_checkBox);
		resources.ApplyResources(this.mg_Password_groupBox, "mg_Password_groupBox");
		this.mg_Password_groupBox.Name = "mg_Password_groupBox";
		this.mg_Password_groupBox.TabStop = false;
		resources.ApplyResources(this.P5_AM_PriceFProg_textBox, "P5_AM_PriceFProg_textBox");
		this.P5_AM_PriceFProg_textBox.Name = "P5_AM_PriceFProg_textBox";
		this.P5_AM_PriceFProg_textBox.TextChanged += new System.EventHandler(AM_xxx_checkbox_CheckChanged);
		this.P5_AM_PriceFProg_textBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(INT7_TextBox_KeyPress);
		resources.ApplyResources(this.P5_AM_Drawer_textBox, "P5_AM_Drawer_textBox");
		this.P5_AM_Drawer_textBox.Name = "P5_AM_Drawer_textBox";
		this.P5_AM_Drawer_textBox.TextChanged += new System.EventHandler(AM_xxx_checkbox_CheckChanged);
		this.P5_AM_Drawer_textBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(INT7_TextBox_KeyPress);
		resources.ApplyResources(this.P5_AM_Account_textBox, "P5_AM_Account_textBox");
		this.P5_AM_Account_textBox.Name = "P5_AM_Account_textBox";
		this.P5_AM_Account_textBox.TextChanged += new System.EventHandler(AM_xxx_checkbox_CheckChanged);
		this.P5_AM_Account_textBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(INT7_TextBox_KeyPress);
		resources.ApplyResources(this.P5_AM_Prog_textBox, "P5_AM_Prog_textBox");
		this.P5_AM_Prog_textBox.Name = "P5_AM_Prog_textBox";
		this.P5_AM_Prog_textBox.TextChanged += new System.EventHandler(AM_xxx_checkbox_CheckChanged);
		this.P5_AM_Prog_textBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(INT7_TextBox_KeyPress);
		resources.ApplyResources(this.P5_AM_Sale_textBox, "P5_AM_Sale_textBox");
		this.P5_AM_Sale_textBox.Name = "P5_AM_Sale_textBox";
		this.P5_AM_Sale_textBox.TextChanged += new System.EventHandler(AM_xxx_checkbox_CheckChanged);
		this.P5_AM_Sale_textBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(INT7_TextBox_KeyPress);
		resources.ApplyResources(this.P5_AM_Admin_textBox, "P5_AM_Admin_textBox");
		this.P5_AM_Admin_textBox.Name = "P5_AM_Admin_textBox";
		this.P5_AM_Admin_textBox.TextChanged += new System.EventHandler(AM_xxx_checkbox_CheckChanged);
		this.P5_AM_Admin_textBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(INT7_TextBox_KeyPress);
		resources.ApplyResources(this.P5_AM_PriceFProg_checkBox, "P5_AM_PriceFProg_checkBox");
		this.P5_AM_PriceFProg_checkBox.Name = "P5_AM_PriceFProg_checkBox";
		this.P5_AM_PriceFProg_checkBox.TabStop = false;
		this.P5_AM_PriceFProg_checkBox.UseVisualStyleBackColor = true;
		this.P5_AM_PriceFProg_checkBox.CheckedChanged += new System.EventHandler(AM_xxx_checkbox_CheckChanged);
		resources.ApplyResources(this.P5_AM_Drawer_checkBox, "P5_AM_Drawer_checkBox");
		this.P5_AM_Drawer_checkBox.Name = "P5_AM_Drawer_checkBox";
		this.P5_AM_Drawer_checkBox.UseVisualStyleBackColor = true;
		this.P5_AM_Drawer_checkBox.CheckedChanged += new System.EventHandler(AM_xxx_checkbox_CheckChanged);
		resources.ApplyResources(this.P5_AM_Account_checkBox, "P5_AM_Account_checkBox");
		this.P5_AM_Account_checkBox.Name = "P5_AM_Account_checkBox";
		this.P5_AM_Account_checkBox.UseVisualStyleBackColor = true;
		this.P5_AM_Account_checkBox.CheckedChanged += new System.EventHandler(AM_xxx_checkbox_CheckChanged);
		resources.ApplyResources(this.P5_AM_Prog_checkBox, "P5_AM_Prog_checkBox");
		this.P5_AM_Prog_checkBox.Name = "P5_AM_Prog_checkBox";
		this.P5_AM_Prog_checkBox.UseVisualStyleBackColor = true;
		this.P5_AM_Prog_checkBox.CheckedChanged += new System.EventHandler(AM_xxx_checkbox_CheckChanged);
		resources.ApplyResources(this.P5_AM_Admin_checkBox, "P5_AM_Admin_checkBox");
		this.P5_AM_Admin_checkBox.Name = "P5_AM_Admin_checkBox";
		this.P5_AM_Admin_checkBox.UseVisualStyleBackColor = true;
		this.P5_AM_Admin_checkBox.CheckedChanged += new System.EventHandler(AM_xxx_checkbox_CheckChanged);
		resources.ApplyResources(this.P5_AM_Sale_checkBox, "P5_AM_Sale_checkBox");
		this.P5_AM_Sale_checkBox.Name = "P5_AM_Sale_checkBox";
		this.P5_AM_Sale_checkBox.UseVisualStyleBackColor = true;
		this.P5_AM_Sale_checkBox.CheckedChanged += new System.EventHandler(AM_xxx_checkbox_CheckChanged);
		this.opconfig_panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.opconfig_panel.Controls.Add(this.P5_ZeroReturn_groupBox);
		this.opconfig_panel.Controls.Add(this.P5_BuyBack_groupBox);
		this.opconfig_panel.Controls.Add(this.P5_PriceFProg_groupBox);
		this.opconfig_panel.Controls.Add(this.P5_Payments_groupBox);
		this.opconfig_panel.Controls.Add(this.P5_Hangup_groupBox);
		resources.ApplyResources(this.opconfig_panel, "opconfig_panel");
		this.opconfig_panel.Name = "opconfig_panel";
		this.P5_ZeroReturn_groupBox.Controls.Add(this.P5_ZeroReturn_0_radioButton);
		this.P5_ZeroReturn_groupBox.Controls.Add(this.P5_ZeroReturn_4_radioButton);
		this.P5_ZeroReturn_groupBox.Controls.Add(this.P5_ZeroReturn_3_radioButton);
		resources.ApplyResources(this.P5_ZeroReturn_groupBox, "P5_ZeroReturn_groupBox");
		this.P5_ZeroReturn_groupBox.Name = "P5_ZeroReturn_groupBox";
		this.P5_ZeroReturn_groupBox.TabStop = false;
		resources.ApplyResources(this.P5_ZeroReturn_0_radioButton, "P5_ZeroReturn_0_radioButton");
		this.P5_ZeroReturn_0_radioButton.Name = "P5_ZeroReturn_0_radioButton";
		this.P5_ZeroReturn_0_radioButton.UseVisualStyleBackColor = true;
		this.P5_ZeroReturn_0_radioButton.CheckedChanged += new System.EventHandler(P5_ZeroReturn_x_radioButton_CheckedChanged);
		resources.ApplyResources(this.P5_ZeroReturn_4_radioButton, "P5_ZeroReturn_4_radioButton");
		this.P5_ZeroReturn_4_radioButton.Name = "P5_ZeroReturn_4_radioButton";
		this.P5_ZeroReturn_4_radioButton.UseVisualStyleBackColor = true;
		this.P5_ZeroReturn_4_radioButton.CheckedChanged += new System.EventHandler(P5_ZeroReturn_x_radioButton_CheckedChanged);
		resources.ApplyResources(this.P5_ZeroReturn_3_radioButton, "P5_ZeroReturn_3_radioButton");
		this.P5_ZeroReturn_3_radioButton.Name = "P5_ZeroReturn_3_radioButton";
		this.P5_ZeroReturn_3_radioButton.UseVisualStyleBackColor = true;
		this.P5_ZeroReturn_3_radioButton.CheckedChanged += new System.EventHandler(P5_ZeroReturn_x_radioButton_CheckedChanged);
		this.P5_BuyBack_groupBox.Controls.Add(this.panel18);
		this.P5_BuyBack_groupBox.Controls.Add(this.P5_BuyBack_A1_checkBox);
		this.P5_BuyBack_groupBox.Controls.Add(this.P5_BuyBack_A16_checkBox);
		this.P5_BuyBack_groupBox.Controls.Add(this.P5_BuyBack_A8_checkBox);
		this.P5_BuyBack_groupBox.Controls.Add(this.P5_BuyBack_A4_checkBox);
		resources.ApplyResources(this.P5_BuyBack_groupBox, "P5_BuyBack_groupBox");
		this.P5_BuyBack_groupBox.Name = "P5_BuyBack_groupBox";
		this.P5_BuyBack_groupBox.TabStop = false;
		this.panel18.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.panel18.Controls.Add(this.P5_BuyBack_A2_checkBox);
		this.panel18.Controls.Add(this.P5_BuyBack_1_Label);
		this.panel18.Controls.Add(this.P5_BuyBack_A32_checkBox);
		this.panel18.Controls.Add(this.P5_BuyBack_A64_checkBox);
		this.panel18.Controls.Add(this.P5_BuyBack_A512_checkBox);
		this.panel18.Controls.Add(this.P5_BuyBack_A256_checkBox);
		this.panel18.Controls.Add(this.P5_BuyBack_A128_checkBox);
		resources.ApplyResources(this.panel18, "panel18");
		this.panel18.Name = "panel18";
		resources.ApplyResources(this.P5_BuyBack_A2_checkBox, "P5_BuyBack_A2_checkBox");
		this.P5_BuyBack_A2_checkBox.Name = "P5_BuyBack_A2_checkBox";
		this.P5_BuyBack_A2_checkBox.UseVisualStyleBackColor = true;
		this.P5_BuyBack_A2_checkBox.CheckedChanged += new System.EventHandler(P5_BuyBack_A2_checkBox_CheckedChanged);
		resources.ApplyResources(this.P5_BuyBack_1_Label, "P5_BuyBack_1_Label");
		this.P5_BuyBack_1_Label.ForeColor = System.Drawing.Color.Red;
		this.P5_BuyBack_1_Label.Name = "P5_BuyBack_1_Label";
		resources.ApplyResources(this.P5_BuyBack_A32_checkBox, "P5_BuyBack_A32_checkBox");
		this.P5_BuyBack_A32_checkBox.Name = "P5_BuyBack_A32_checkBox";
		this.P5_BuyBack_A32_checkBox.UseVisualStyleBackColor = true;
		this.P5_BuyBack_A32_checkBox.CheckedChanged += new System.EventHandler(P5_BuyBack_A2_checkBox_CheckedChanged);
		resources.ApplyResources(this.P5_BuyBack_A64_checkBox, "P5_BuyBack_A64_checkBox");
		this.P5_BuyBack_A64_checkBox.Name = "P5_BuyBack_A64_checkBox";
		this.P5_BuyBack_A64_checkBox.UseVisualStyleBackColor = true;
		this.P5_BuyBack_A64_checkBox.CheckedChanged += new System.EventHandler(P5_BuyBack_A2_checkBox_CheckedChanged);
		resources.ApplyResources(this.P5_BuyBack_A256_checkBox, "P5_BuyBack_A256_checkBox");
		this.P5_BuyBack_A256_checkBox.Name = "P5_BuyBack_A256_checkBox";
		this.P5_BuyBack_A256_checkBox.UseVisualStyleBackColor = true;
		this.P5_BuyBack_A256_checkBox.CheckedChanged += new System.EventHandler(P5_BuyBack_A2_checkBox_CheckedChanged);
		resources.ApplyResources(this.P5_BuyBack_A128_checkBox, "P5_BuyBack_A128_checkBox");
		this.P5_BuyBack_A128_checkBox.Name = "P5_BuyBack_A128_checkBox";
		this.P5_BuyBack_A128_checkBox.UseVisualStyleBackColor = true;
		this.P5_BuyBack_A128_checkBox.CheckedChanged += new System.EventHandler(P5_BuyBack_A2_checkBox_CheckedChanged);
		resources.ApplyResources(this.P5_BuyBack_A1_checkBox, "P5_BuyBack_A1_checkBox");
		this.P5_BuyBack_A1_checkBox.Name = "P5_BuyBack_A1_checkBox";
		this.P5_BuyBack_A1_checkBox.UseVisualStyleBackColor = true;
		this.P5_BuyBack_A1_checkBox.CheckedChanged += new System.EventHandler(P5_BuyBack_Ax_checkBox_CheckedChanged);
		resources.ApplyResources(this.P5_BuyBack_A16_checkBox, "P5_BuyBack_A16_checkBox");
		this.P5_BuyBack_A16_checkBox.Name = "P5_BuyBack_A16_checkBox";
		this.P5_BuyBack_A16_checkBox.UseVisualStyleBackColor = true;
		this.P5_BuyBack_A16_checkBox.CheckedChanged += new System.EventHandler(P5_BuyBack_Ax_checkBox_CheckedChanged);
		resources.ApplyResources(this.P5_BuyBack_A8_checkBox, "P5_BuyBack_A8_checkBox");
		this.P5_BuyBack_A8_checkBox.Name = "P5_BuyBack_A8_checkBox";
		this.P5_BuyBack_A8_checkBox.UseVisualStyleBackColor = true;
		this.P5_BuyBack_A8_checkBox.CheckedChanged += new System.EventHandler(P5_BuyBack_Ax_checkBox_CheckedChanged);
		resources.ApplyResources(this.P5_BuyBack_A4_checkBox, "P5_BuyBack_A4_checkBox");
		this.P5_BuyBack_A4_checkBox.Name = "P5_BuyBack_A4_checkBox";
		this.P5_BuyBack_A4_checkBox.UseVisualStyleBackColor = true;
		this.P5_BuyBack_A4_checkBox.CheckedChanged += new System.EventHandler(P5_BuyBack_Ax_checkBox_CheckedChanged);
		this.P5_PriceFProg_groupBox.Controls.Add(this.P5_PriceFProg_1_radioButton);
		this.P5_PriceFProg_groupBox.Controls.Add(this.P5_PriceFProg_4_radioButton);
		this.P5_PriceFProg_groupBox.Controls.Add(this.P5_PriceFProg_2_radioButton);
		this.P5_PriceFProg_groupBox.Controls.Add(this.P5_PriceFProg_0_radioButton);
		this.P5_PriceFProg_groupBox.Controls.Add(this.P5_PriceFProg_3_radioButton);
		resources.ApplyResources(this.P5_PriceFProg_groupBox, "P5_PriceFProg_groupBox");
		this.P5_PriceFProg_groupBox.Name = "P5_PriceFProg_groupBox";
		this.P5_PriceFProg_groupBox.TabStop = false;
		resources.ApplyResources(this.P5_PriceFProg_1_radioButton, "P5_PriceFProg_1_radioButton");
		this.P5_PriceFProg_1_radioButton.Name = "P5_PriceFProg_1_radioButton";
		this.P5_PriceFProg_1_radioButton.UseVisualStyleBackColor = true;
		this.P5_PriceFProg_1_radioButton.CheckedChanged += new System.EventHandler(P5_PriceFProg_x_radioButton_CheckedChanged);
		resources.ApplyResources(this.P5_PriceFProg_4_radioButton, "P5_PriceFProg_4_radioButton");
		this.P5_PriceFProg_4_radioButton.Name = "P5_PriceFProg_4_radioButton";
		this.P5_PriceFProg_4_radioButton.UseVisualStyleBackColor = true;
		this.P5_PriceFProg_4_radioButton.CheckedChanged += new System.EventHandler(P5_PriceFProg_x_radioButton_CheckedChanged);
		resources.ApplyResources(this.P5_PriceFProg_2_radioButton, "P5_PriceFProg_2_radioButton");
		this.P5_PriceFProg_2_radioButton.Name = "P5_PriceFProg_2_radioButton";
		this.P5_PriceFProg_2_radioButton.UseVisualStyleBackColor = true;
		this.P5_PriceFProg_2_radioButton.CheckedChanged += new System.EventHandler(P5_PriceFProg_x_radioButton_CheckedChanged);
		resources.ApplyResources(this.P5_PriceFProg_0_radioButton, "P5_PriceFProg_0_radioButton");
		this.P5_PriceFProg_0_radioButton.Name = "P5_PriceFProg_0_radioButton";
		this.P5_PriceFProg_0_radioButton.UseVisualStyleBackColor = true;
		this.P5_PriceFProg_0_radioButton.CheckedChanged += new System.EventHandler(P5_PriceFProg_x_radioButton_CheckedChanged);
		resources.ApplyResources(this.P5_PriceFProg_3_radioButton, "P5_PriceFProg_3_radioButton");
		this.P5_PriceFProg_3_radioButton.Name = "P5_PriceFProg_3_radioButton";
		this.P5_PriceFProg_3_radioButton.UseVisualStyleBackColor = true;
		this.P5_PriceFProg_3_radioButton.CheckedChanged += new System.EventHandler(P5_PriceFProg_x_radioButton_CheckedChanged);
		this.P5_Payments_groupBox.Controls.Add(this.P5_Payments_A32_checkBox);
		this.P5_Payments_groupBox.Controls.Add(this.P5_Payments_A16_checkBox);
		this.P5_Payments_groupBox.Controls.Add(this.P5_Payments_A8_checkBox);
		this.P5_Payments_groupBox.Controls.Add(this.P5_Payments_A4_checkBox);
		this.P5_Payments_groupBox.Controls.Add(this.P5_Payments_A2_checkBox);
		this.P5_Payments_groupBox.Controls.Add(this.P5_Payments_A1_checkBox);
		resources.ApplyResources(this.P5_Payments_groupBox, "P5_Payments_groupBox");
		this.P5_Payments_groupBox.Name = "P5_Payments_groupBox";
		this.P5_Payments_groupBox.TabStop = false;
		resources.ApplyResources(this.P5_Payments_A32_checkBox, "P5_Payments_A32_checkBox");
		this.P5_Payments_A32_checkBox.Name = "P5_Payments_A32_checkBox";
		this.P5_Payments_A32_checkBox.UseVisualStyleBackColor = true;
		this.P5_Payments_A32_checkBox.CheckedChanged += new System.EventHandler(P5_Payments_Ax_checkBox_CheckedChanged);
		resources.ApplyResources(this.P5_Payments_A16_checkBox, "P5_Payments_A16_checkBox");
		this.P5_Payments_A16_checkBox.Name = "P5_Payments_A16_checkBox";
		this.P5_Payments_A16_checkBox.UseVisualStyleBackColor = true;
		this.P5_Payments_A16_checkBox.CheckedChanged += new System.EventHandler(P5_Payments_Ax_checkBox_CheckedChanged);
		resources.ApplyResources(this.P5_Payments_A8_checkBox, "P5_Payments_A8_checkBox");
		this.P5_Payments_A8_checkBox.Name = "P5_Payments_A8_checkBox";
		this.P5_Payments_A8_checkBox.UseVisualStyleBackColor = true;
		this.P5_Payments_A8_checkBox.CheckedChanged += new System.EventHandler(P5_Payments_Ax_checkBox_CheckedChanged);
		resources.ApplyResources(this.P5_Payments_A4_checkBox, "P5_Payments_A4_checkBox");
		this.P5_Payments_A4_checkBox.Name = "P5_Payments_A4_checkBox";
		this.P5_Payments_A4_checkBox.UseVisualStyleBackColor = true;
		this.P5_Payments_A4_checkBox.CheckedChanged += new System.EventHandler(P5_Payments_Ax_checkBox_CheckedChanged);
		resources.ApplyResources(this.P5_Payments_A2_checkBox, "P5_Payments_A2_checkBox");
		this.P5_Payments_A2_checkBox.Name = "P5_Payments_A2_checkBox";
		this.P5_Payments_A2_checkBox.UseVisualStyleBackColor = true;
		this.P5_Payments_A2_checkBox.CheckedChanged += new System.EventHandler(P5_Payments_Ax_checkBox_CheckedChanged);
		resources.ApplyResources(this.P5_Payments_A1_checkBox, "P5_Payments_A1_checkBox");
		this.P5_Payments_A1_checkBox.Checked = true;
		this.P5_Payments_A1_checkBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.P5_Payments_A1_checkBox.Name = "P5_Payments_A1_checkBox";
		this.P5_Payments_A1_checkBox.UseVisualStyleBackColor = true;
		this.P5_Payments_A1_checkBox.CheckedChanged += new System.EventHandler(P5_Payments_Ax_checkBox_CheckedChanged);
		this.P5_Hangup_groupBox.Controls.Add(this.P5_Hangup_1_radioButton);
		this.P5_Hangup_groupBox.Controls.Add(this.P5_Hangup_0_radioButton);
		this.P5_Hangup_groupBox.Controls.Add(this.P5_Hangup_3_radioButton);
		this.P5_Hangup_groupBox.Controls.Add(this.P5_Hangup_2_radioButton);
		resources.ApplyResources(this.P5_Hangup_groupBox, "P5_Hangup_groupBox");
		this.P5_Hangup_groupBox.Name = "P5_Hangup_groupBox";
		this.P5_Hangup_groupBox.TabStop = false;
		resources.ApplyResources(this.P5_Hangup_1_radioButton, "P5_Hangup_1_radioButton");
		this.P5_Hangup_1_radioButton.Name = "P5_Hangup_1_radioButton";
		this.P5_Hangup_1_radioButton.UseVisualStyleBackColor = true;
		this.P5_Hangup_1_radioButton.CheckedChanged += new System.EventHandler(P5_Hangup_x_radioButton_CheckedChanged);
		resources.ApplyResources(this.P5_Hangup_0_radioButton, "P5_Hangup_0_radioButton");
		this.P5_Hangup_0_radioButton.Checked = true;
		this.P5_Hangup_0_radioButton.Name = "P5_Hangup_0_radioButton";
		this.P5_Hangup_0_radioButton.TabStop = true;
		this.P5_Hangup_0_radioButton.UseVisualStyleBackColor = true;
		this.P5_Hangup_0_radioButton.CheckedChanged += new System.EventHandler(P5_Hangup_x_radioButton_CheckedChanged);
		resources.ApplyResources(this.P5_Hangup_3_radioButton, "P5_Hangup_3_radioButton");
		this.P5_Hangup_3_radioButton.Name = "P5_Hangup_3_radioButton";
		this.P5_Hangup_3_radioButton.UseVisualStyleBackColor = true;
		this.P5_Hangup_3_radioButton.CheckedChanged += new System.EventHandler(P5_Hangup_x_radioButton_CheckedChanged);
		resources.ApplyResources(this.P5_Hangup_2_radioButton, "P5_Hangup_2_radioButton");
		this.P5_Hangup_2_radioButton.Name = "P5_Hangup_2_radioButton";
		this.P5_Hangup_2_radioButton.UseVisualStyleBackColor = true;
		this.P5_Hangup_2_radioButton.CheckedChanged += new System.EventHandler(P5_Hangup_x_radioButton_CheckedChanged);
		this.unit_panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.unit_panel.Controls.Add(this.P2_UnitSetting_groupBox);
		this.unit_panel.Controls.Add(this.P4_UpdateSoftware_button);
		this.unit_panel.Controls.Add(this.P4_TotalRounding_groupBox);
		this.unit_panel.Controls.Add(this.P4_ItemRounding_groupBox);
		this.unit_panel.Controls.Add(this.P4_UPriceRadixPoint_groupBox);
		this.unit_panel.Controls.Add(this.P4_TotalRadixPoint_groupBox);
		resources.ApplyResources(this.unit_panel, "unit_panel");
		this.unit_panel.Name = "unit_panel";
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_PrintUnit_Money_label);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_PrintUnit_UPricePcs_label);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_PrintUnit_UPriceWeight_label);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_PrintUnit_Pcs_label);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_PrintUnit_tPcs_label);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_PrintUnit_addPcs_label);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_PrintUnit_addWeight_label);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_PrintUnit_tWeight_label);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_PrintUnit_Weight_label);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_PrintUnit_Money_checkbox);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_PrintUnit_UPrice_checkbox);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_PrintUnit_Amount_checkbox);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_Suffix_textBox);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_Prefix_textBox);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_Suffix_label);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_Money_label);
		this.P2_UnitSetting_groupBox.Controls.Add(this.P2_Prefix_label);
		resources.ApplyResources(this.P2_UnitSetting_groupBox, "P2_UnitSetting_groupBox");
		this.P2_UnitSetting_groupBox.Name = "P2_UnitSetting_groupBox";
		this.P2_UnitSetting_groupBox.TabStop = false;
		resources.ApplyResources(this.P2_PrintUnit_Money_label, "P2_PrintUnit_Money_label");
		this.P2_PrintUnit_Money_label.Name = "P2_PrintUnit_Money_label";
		resources.ApplyResources(this.P2_PrintUnit_UPricePcs_label, "P2_PrintUnit_UPricePcs_label");
		this.P2_PrintUnit_UPricePcs_label.Name = "P2_PrintUnit_UPricePcs_label";
		resources.ApplyResources(this.P2_PrintUnit_UPriceWeight_label, "P2_PrintUnit_UPriceWeight_label");
		this.P2_PrintUnit_UPriceWeight_label.Name = "P2_PrintUnit_UPriceWeight_label";
		resources.ApplyResources(this.P2_PrintUnit_Pcs_label, "P2_PrintUnit_Pcs_label");
		this.P2_PrintUnit_Pcs_label.Name = "P2_PrintUnit_Pcs_label";
		resources.ApplyResources(this.P2_PrintUnit_tPcs_label, "P2_PrintUnit_tPcs_label");
		this.P2_PrintUnit_tPcs_label.Name = "P2_PrintUnit_tPcs_label";
		resources.ApplyResources(this.P2_PrintUnit_addPcs_label, "P2_PrintUnit_addPcs_label");
		this.P2_PrintUnit_addPcs_label.Name = "P2_PrintUnit_addPcs_label";
		resources.ApplyResources(this.P2_PrintUnit_addWeight_label, "P2_PrintUnit_addWeight_label");
		this.P2_PrintUnit_addWeight_label.Name = "P2_PrintUnit_addWeight_label";
		resources.ApplyResources(this.P2_PrintUnit_tWeight_label, "P2_PrintUnit_tWeight_label");
		this.P2_PrintUnit_tWeight_label.Name = "P2_PrintUnit_tWeight_label";
		resources.ApplyResources(this.P2_PrintUnit_Weight_label, "P2_PrintUnit_Weight_label");
		this.P2_PrintUnit_Weight_label.Name = "P2_PrintUnit_Weight_label";
		resources.ApplyResources(this.P2_PrintUnit_Money_checkbox, "P2_PrintUnit_Money_checkbox");
		this.P2_PrintUnit_Money_checkbox.Name = "P2_PrintUnit_Money_checkbox";
		this.P2_PrintUnit_Money_checkbox.UseVisualStyleBackColor = true;
		this.P2_PrintUnit_Money_checkbox.CheckedChanged += new System.EventHandler(P2_PrintUnit_Money_checkbox_CheckedChanged);
		resources.ApplyResources(this.P2_PrintUnit_UPrice_checkbox, "P2_PrintUnit_UPrice_checkbox");
		this.P2_PrintUnit_UPrice_checkbox.Name = "P2_PrintUnit_UPrice_checkbox";
		this.P2_PrintUnit_UPrice_checkbox.UseVisualStyleBackColor = true;
		this.P2_PrintUnit_UPrice_checkbox.CheckedChanged += new System.EventHandler(P2_PrintUnit_UPrice_checkbox_CheckedChanged);
		resources.ApplyResources(this.P2_PrintUnit_Amount_checkbox, "P2_PrintUnit_Amount_checkbox");
		this.P2_PrintUnit_Amount_checkbox.Name = "P2_PrintUnit_Amount_checkbox";
		this.P2_PrintUnit_Amount_checkbox.UseVisualStyleBackColor = true;
		this.P2_PrintUnit_Amount_checkbox.CheckedChanged += new System.EventHandler(P2_PrintUnit_Amount_checkbox_CheckedChanged);
		resources.ApplyResources(this.P2_Suffix_textBox, "P2_Suffix_textBox");
		this.P2_Suffix_textBox.Name = "P2_Suffix_textBox";
		this.P2_Suffix_textBox.TextChanged += new System.EventHandler(P2_Suffix_textBox_TextChanged);
		resources.ApplyResources(this.P2_Prefix_textBox, "P2_Prefix_textBox");
		this.P2_Prefix_textBox.Name = "P2_Prefix_textBox";
		this.P2_Prefix_textBox.TextChanged += new System.EventHandler(P2_Prefix_textBox_TextChanged);
		resources.ApplyResources(this.P2_Suffix_label, "P2_Suffix_label");
		this.P2_Suffix_label.Name = "P2_Suffix_label";
		resources.ApplyResources(this.P2_Money_label, "P2_Money_label");
		this.P2_Money_label.Name = "P2_Money_label";
		resources.ApplyResources(this.P2_Prefix_label, "P2_Prefix_label");
		this.P2_Prefix_label.Name = "P2_Prefix_label";
		resources.ApplyResources(this.P4_UpdateSoftware_button, "P4_UpdateSoftware_button");
		this.P4_UpdateSoftware_button.Name = "P4_UpdateSoftware_button";
		this.P4_UpdateSoftware_button.UseVisualStyleBackColor = true;
		this.P4_UpdateSoftware_button.Click += new System.EventHandler(P4_UpdateSoftware_button_Click);
		this.P4_TotalRounding_groupBox.Controls.Add(this.P4_TotalRounding0_S0_radioButton);
		this.P4_TotalRounding_groupBox.Controls.Add(this.P4_TotalRounding3_S10_radioButton);
		this.P4_TotalRounding_groupBox.Controls.Add(this.P4_TotalRounding2_S1_radioButton);
		this.P4_TotalRounding_groupBox.Controls.Add(this.P4_TotalRounding4_S2_radioButton);
		this.P4_TotalRounding_groupBox.Controls.Add(this.P4_TotalRounding1_S9_radioButton);
		resources.ApplyResources(this.P4_TotalRounding_groupBox, "P4_TotalRounding_groupBox");
		this.P4_TotalRounding_groupBox.Name = "P4_TotalRounding_groupBox";
		this.P4_TotalRounding_groupBox.TabStop = false;
		resources.ApplyResources(this.P4_TotalRounding0_S0_radioButton, "P4_TotalRounding0_S0_radioButton");
		this.P4_TotalRounding0_S0_radioButton.Checked = true;
		this.P4_TotalRounding0_S0_radioButton.Name = "P4_TotalRounding0_S0_radioButton";
		this.P4_TotalRounding0_S0_radioButton.TabStop = true;
		this.P4_TotalRounding0_S0_radioButton.UseVisualStyleBackColor = true;
		this.P4_TotalRounding0_S0_radioButton.CheckedChanged += new System.EventHandler(P4_TotalRoundingX_SX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_TotalRounding3_S10_radioButton, "P4_TotalRounding3_S10_radioButton");
		this.P4_TotalRounding3_S10_radioButton.Name = "P4_TotalRounding3_S10_radioButton";
		this.P4_TotalRounding3_S10_radioButton.UseVisualStyleBackColor = true;
		this.P4_TotalRounding3_S10_radioButton.CheckedChanged += new System.EventHandler(P4_TotalRoundingX_SX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_TotalRounding2_S1_radioButton, "P4_TotalRounding2_S1_radioButton");
		this.P4_TotalRounding2_S1_radioButton.Name = "P4_TotalRounding2_S1_radioButton";
		this.P4_TotalRounding2_S1_radioButton.UseVisualStyleBackColor = true;
		this.P4_TotalRounding2_S1_radioButton.CheckedChanged += new System.EventHandler(P4_TotalRoundingX_SX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_TotalRounding4_S2_radioButton, "P4_TotalRounding4_S2_radioButton");
		this.P4_TotalRounding4_S2_radioButton.Name = "P4_TotalRounding4_S2_radioButton";
		this.P4_TotalRounding4_S2_radioButton.UseVisualStyleBackColor = true;
		this.P4_TotalRounding4_S2_radioButton.CheckedChanged += new System.EventHandler(P4_TotalRoundingX_SX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_TotalRounding1_S9_radioButton, "P4_TotalRounding1_S9_radioButton");
		this.P4_TotalRounding1_S9_radioButton.Name = "P4_TotalRounding1_S9_radioButton";
		this.P4_TotalRounding1_S9_radioButton.UseVisualStyleBackColor = true;
		this.P4_TotalRounding1_S9_radioButton.CheckedChanged += new System.EventHandler(P4_TotalRoundingX_SX_radioButton_CheckedChanged);
		this.P4_ItemRounding_groupBox.Controls.Add(this.P4_ItemRounding0_S0_radioButton);
		this.P4_ItemRounding_groupBox.Controls.Add(this.P4_ItemRounding3_S10_radioButton);
		this.P4_ItemRounding_groupBox.Controls.Add(this.P4_ItemRounding2_S1_radioButton);
		this.P4_ItemRounding_groupBox.Controls.Add(this.P4_ItemRounding1_S9_radioButton);
		this.P4_ItemRounding_groupBox.Controls.Add(this.P4_ItemRounding4_S2_radioButton);
		resources.ApplyResources(this.P4_ItemRounding_groupBox, "P4_ItemRounding_groupBox");
		this.P4_ItemRounding_groupBox.Name = "P4_ItemRounding_groupBox";
		this.P4_ItemRounding_groupBox.TabStop = false;
		resources.ApplyResources(this.P4_ItemRounding0_S0_radioButton, "P4_ItemRounding0_S0_radioButton");
		this.P4_ItemRounding0_S0_radioButton.Checked = true;
		this.P4_ItemRounding0_S0_radioButton.Name = "P4_ItemRounding0_S0_radioButton";
		this.P4_ItemRounding0_S0_radioButton.TabStop = true;
		this.P4_ItemRounding0_S0_radioButton.UseVisualStyleBackColor = true;
		this.P4_ItemRounding0_S0_radioButton.CheckedChanged += new System.EventHandler(P4_ItemRoundingX_SX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_ItemRounding3_S10_radioButton, "P4_ItemRounding3_S10_radioButton");
		this.P4_ItemRounding3_S10_radioButton.Name = "P4_ItemRounding3_S10_radioButton";
		this.P4_ItemRounding3_S10_radioButton.UseVisualStyleBackColor = true;
		this.P4_ItemRounding3_S10_radioButton.CheckedChanged += new System.EventHandler(P4_ItemRoundingX_SX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_ItemRounding2_S1_radioButton, "P4_ItemRounding2_S1_radioButton");
		this.P4_ItemRounding2_S1_radioButton.Name = "P4_ItemRounding2_S1_radioButton";
		this.P4_ItemRounding2_S1_radioButton.UseVisualStyleBackColor = true;
		this.P4_ItemRounding2_S1_radioButton.CheckedChanged += new System.EventHandler(P4_ItemRoundingX_SX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_ItemRounding1_S9_radioButton, "P4_ItemRounding1_S9_radioButton");
		this.P4_ItemRounding1_S9_radioButton.Name = "P4_ItemRounding1_S9_radioButton";
		this.P4_ItemRounding1_S9_radioButton.UseVisualStyleBackColor = true;
		this.P4_ItemRounding1_S9_radioButton.CheckedChanged += new System.EventHandler(P4_ItemRoundingX_SX_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_ItemRounding4_S2_radioButton, "P4_ItemRounding4_S2_radioButton");
		this.P4_ItemRounding4_S2_radioButton.Name = "P4_ItemRounding4_S2_radioButton";
		this.P4_ItemRounding4_S2_radioButton.UseVisualStyleBackColor = true;
		this.P4_ItemRounding4_S2_radioButton.CheckedChanged += new System.EventHandler(P4_ItemRoundingX_SX_radioButton_CheckedChanged);
		this.P4_UPriceRadixPoint_groupBox.Controls.Add(this.P4_UPriceRadixPoint5_radioButton);
		this.P4_UPriceRadixPoint_groupBox.Controls.Add(this.P4_UPriceRadixPoint4_radioButton);
		this.P4_UPriceRadixPoint_groupBox.Controls.Add(this.P4_UPriceRadixPoint3_radioButton);
		this.P4_UPriceRadixPoint_groupBox.Controls.Add(this.P4_UPriceRadixPoint2_radioButton);
		this.P4_UPriceRadixPoint_groupBox.Controls.Add(this.P4_UPriceRadixPoint0_radioButton);
		this.P4_UPriceRadixPoint_groupBox.Controls.Add(this.P4_UPriceRadixPoint1_radioButton);
		resources.ApplyResources(this.P4_UPriceRadixPoint_groupBox, "P4_UPriceRadixPoint_groupBox");
		this.P4_UPriceRadixPoint_groupBox.Name = "P4_UPriceRadixPoint_groupBox";
		this.P4_UPriceRadixPoint_groupBox.TabStop = false;
		resources.ApplyResources(this.P4_UPriceRadixPoint5_radioButton, "P4_UPriceRadixPoint5_radioButton");
		this.P4_UPriceRadixPoint5_radioButton.Name = "P4_UPriceRadixPoint5_radioButton";
		this.P4_UPriceRadixPoint5_radioButton.UseVisualStyleBackColor = true;
		this.P4_UPriceRadixPoint5_radioButton.CheckedChanged += new System.EventHandler(P4_UPriceRadixPoint_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_UPriceRadixPoint4_radioButton, "P4_UPriceRadixPoint4_radioButton");
		this.P4_UPriceRadixPoint4_radioButton.Name = "P4_UPriceRadixPoint4_radioButton";
		this.P4_UPriceRadixPoint4_radioButton.UseVisualStyleBackColor = true;
		this.P4_UPriceRadixPoint4_radioButton.CheckedChanged += new System.EventHandler(P4_UPriceRadixPoint_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_UPriceRadixPoint3_radioButton, "P4_UPriceRadixPoint3_radioButton");
		this.P4_UPriceRadixPoint3_radioButton.Name = "P4_UPriceRadixPoint3_radioButton";
		this.P4_UPriceRadixPoint3_radioButton.UseVisualStyleBackColor = true;
		this.P4_UPriceRadixPoint3_radioButton.CheckedChanged += new System.EventHandler(P4_UPriceRadixPoint_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_UPriceRadixPoint2_radioButton, "P4_UPriceRadixPoint2_radioButton");
		this.P4_UPriceRadixPoint2_radioButton.Checked = true;
		this.P4_UPriceRadixPoint2_radioButton.Name = "P4_UPriceRadixPoint2_radioButton";
		this.P4_UPriceRadixPoint2_radioButton.TabStop = true;
		this.P4_UPriceRadixPoint2_radioButton.UseVisualStyleBackColor = true;
		this.P4_UPriceRadixPoint2_radioButton.CheckedChanged += new System.EventHandler(P4_UPriceRadixPoint_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_UPriceRadixPoint0_radioButton, "P4_UPriceRadixPoint0_radioButton");
		this.P4_UPriceRadixPoint0_radioButton.Name = "P4_UPriceRadixPoint0_radioButton";
		this.P4_UPriceRadixPoint0_radioButton.UseVisualStyleBackColor = true;
		this.P4_UPriceRadixPoint0_radioButton.CheckedChanged += new System.EventHandler(P4_UPriceRadixPoint_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_UPriceRadixPoint1_radioButton, "P4_UPriceRadixPoint1_radioButton");
		this.P4_UPriceRadixPoint1_radioButton.Name = "P4_UPriceRadixPoint1_radioButton";
		this.P4_UPriceRadixPoint1_radioButton.UseVisualStyleBackColor = true;
		this.P4_UPriceRadixPoint1_radioButton.CheckedChanged += new System.EventHandler(P4_UPriceRadixPoint_radioButton_CheckedChanged);
		this.P4_TotalRadixPoint_groupBox.Controls.Add(this.P4_TotalRadixPoint5_radioButton);
		this.P4_TotalRadixPoint_groupBox.Controls.Add(this.P4_TotalRadixPoint3_radioButton);
		this.P4_TotalRadixPoint_groupBox.Controls.Add(this.P4_TotalRadixPoint4_radioButton);
		this.P4_TotalRadixPoint_groupBox.Controls.Add(this.P4_TotalRadixPoint2_radioButton);
		this.P4_TotalRadixPoint_groupBox.Controls.Add(this.P4_TotalRadixPoint0_radioButton);
		this.P4_TotalRadixPoint_groupBox.Controls.Add(this.P4_TotalRadixPoint1_radioButton);
		resources.ApplyResources(this.P4_TotalRadixPoint_groupBox, "P4_TotalRadixPoint_groupBox");
		this.P4_TotalRadixPoint_groupBox.Name = "P4_TotalRadixPoint_groupBox";
		this.P4_TotalRadixPoint_groupBox.TabStop = false;
		resources.ApplyResources(this.P4_TotalRadixPoint5_radioButton, "P4_TotalRadixPoint5_radioButton");
		this.P4_TotalRadixPoint5_radioButton.Name = "P4_TotalRadixPoint5_radioButton";
		this.P4_TotalRadixPoint5_radioButton.UseVisualStyleBackColor = true;
		this.P4_TotalRadixPoint5_radioButton.CheckedChanged += new System.EventHandler(P4_TotalRadixPoint_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_TotalRadixPoint3_radioButton, "P4_TotalRadixPoint3_radioButton");
		this.P4_TotalRadixPoint3_radioButton.Name = "P4_TotalRadixPoint3_radioButton";
		this.P4_TotalRadixPoint3_radioButton.UseVisualStyleBackColor = true;
		this.P4_TotalRadixPoint3_radioButton.CheckedChanged += new System.EventHandler(P4_TotalRadixPoint_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_TotalRadixPoint4_radioButton, "P4_TotalRadixPoint4_radioButton");
		this.P4_TotalRadixPoint4_radioButton.Name = "P4_TotalRadixPoint4_radioButton";
		this.P4_TotalRadixPoint4_radioButton.UseVisualStyleBackColor = true;
		this.P4_TotalRadixPoint4_radioButton.CheckedChanged += new System.EventHandler(P4_TotalRadixPoint_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_TotalRadixPoint2_radioButton, "P4_TotalRadixPoint2_radioButton");
		this.P4_TotalRadixPoint2_radioButton.Checked = true;
		this.P4_TotalRadixPoint2_radioButton.Name = "P4_TotalRadixPoint2_radioButton";
		this.P4_TotalRadixPoint2_radioButton.TabStop = true;
		this.P4_TotalRadixPoint2_radioButton.UseVisualStyleBackColor = true;
		this.P4_TotalRadixPoint2_radioButton.CheckedChanged += new System.EventHandler(P4_TotalRadixPoint_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_TotalRadixPoint0_radioButton, "P4_TotalRadixPoint0_radioButton");
		this.P4_TotalRadixPoint0_radioButton.Name = "P4_TotalRadixPoint0_radioButton";
		this.P4_TotalRadixPoint0_radioButton.UseVisualStyleBackColor = true;
		this.P4_TotalRadixPoint0_radioButton.CheckedChanged += new System.EventHandler(P4_TotalRadixPoint_radioButton_CheckedChanged);
		resources.ApplyResources(this.P4_TotalRadixPoint1_radioButton, "P4_TotalRadixPoint1_radioButton");
		this.P4_TotalRadixPoint1_radioButton.Name = "P4_TotalRadixPoint1_radioButton";
		this.P4_TotalRadixPoint1_radioButton.UseVisualStyleBackColor = true;
		this.P4_TotalRadixPoint1_radioButton.CheckedChanged += new System.EventHandler(P4_TotalRadixPoint_radioButton_CheckedChanged);
		this.w5th_panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.w5th_panel.Controls.Add(this.P3_noPLUinfo_groupBox);
		this.w5th_panel.Controls.Add(this.P3_PLUinfo_groupBox);
		resources.ApplyResources(this.w5th_panel, "w5th_panel");
		this.w5th_panel.Name = "w5th_panel";
		this.P3_noPLUinfo_groupBox.Controls.Add(this.P3_2_panel);
		this.P3_noPLUinfo_groupBox.Controls.Add(this.panel6);
		this.P3_noPLUinfo_groupBox.Controls.Add(this.P3_1_panel);
		resources.ApplyResources(this.P3_noPLUinfo_groupBox, "P3_noPLUinfo_groupBox");
		this.P3_noPLUinfo_groupBox.Name = "P3_noPLUinfo_groupBox";
		this.P3_noPLUinfo_groupBox.TabStop = false;
		this.P3_2_panel.Controls.Add(this.P3_Idleinfo_Source3_textBox);
		this.P3_2_panel.Controls.Add(this.P3_label4);
		this.P3_2_panel.Controls.Add(this.P3_Idleinfo_Source0_radioButton);
		this.P3_2_panel.Controls.Add(this.P3_Idleinfo_Source1_radioButton);
		this.P3_2_panel.Controls.Add(this.P3_Idleinfo_Source2_radioButton);
		this.P3_2_panel.Controls.Add(this.P3_Idleinfo_Source3_radioButton);
		resources.ApplyResources(this.P3_2_panel, "P3_2_panel");
		this.P3_2_panel.Name = "P3_2_panel";
		resources.ApplyResources(this.P3_Idleinfo_Source3_textBox, "P3_Idleinfo_Source3_textBox");
		this.P3_Idleinfo_Source3_textBox.Name = "P3_Idleinfo_Source3_textBox";
		this.P3_Idleinfo_Source3_textBox.TextChanged += new System.EventHandler(P3_Idleinfo_Sourcex_radioButton_CheckedChanged);
		resources.ApplyResources(this.P3_label4, "P3_label4");
		this.P3_label4.Name = "P3_label4";
		resources.ApplyResources(this.P3_Idleinfo_Source0_radioButton, "P3_Idleinfo_Source0_radioButton");
		this.P3_Idleinfo_Source0_radioButton.Checked = true;
		this.P3_Idleinfo_Source0_radioButton.Name = "P3_Idleinfo_Source0_radioButton";
		this.P3_Idleinfo_Source0_radioButton.TabStop = true;
		this.P3_Idleinfo_Source0_radioButton.UseVisualStyleBackColor = true;
		this.P3_Idleinfo_Source0_radioButton.CheckedChanged += new System.EventHandler(P3_Idleinfo_Sourcex_radioButton_CheckedChanged);
		resources.ApplyResources(this.P3_Idleinfo_Source1_radioButton, "P3_Idleinfo_Source1_radioButton");
		this.P3_Idleinfo_Source1_radioButton.Name = "P3_Idleinfo_Source1_radioButton";
		this.P3_Idleinfo_Source1_radioButton.UseVisualStyleBackColor = true;
		this.P3_Idleinfo_Source1_radioButton.CheckedChanged += new System.EventHandler(P3_Idleinfo_Sourcex_radioButton_CheckedChanged);
		resources.ApplyResources(this.P3_Idleinfo_Source2_radioButton, "P3_Idleinfo_Source2_radioButton");
		this.P3_Idleinfo_Source2_radioButton.Name = "P3_Idleinfo_Source2_radioButton";
		this.P3_Idleinfo_Source2_radioButton.UseVisualStyleBackColor = true;
		this.P3_Idleinfo_Source2_radioButton.CheckedChanged += new System.EventHandler(P3_Idleinfo_Sourcex_radioButton_CheckedChanged);
		resources.ApplyResources(this.P3_Idleinfo_Source3_radioButton, "P3_Idleinfo_Source3_radioButton");
		this.P3_Idleinfo_Source3_radioButton.Name = "P3_Idleinfo_Source3_radioButton";
		this.P3_Idleinfo_Source3_radioButton.UseVisualStyleBackColor = true;
		this.P3_Idleinfo_Source3_radioButton.CheckedChanged += new System.EventHandler(P3_Idleinfo_Sourcex_radioButton_CheckedChanged);
		this.panel6.Controls.Add(this.P3_label5);
		this.panel6.Controls.Add(this.P3_Accedinfo_Source2_radioButton);
		this.panel6.Controls.Add(this.P3_Accedinfo_Source0_radioButton);
		this.panel6.Controls.Add(this.P3_Accedinfo_Source1_radioButton);
		resources.ApplyResources(this.panel6, "panel6");
		this.panel6.Name = "panel6";
		resources.ApplyResources(this.P3_label5, "P3_label5");
		this.P3_label5.Name = "P3_label5";
		resources.ApplyResources(this.P3_Accedinfo_Source2_radioButton, "P3_Accedinfo_Source2_radioButton");
		this.P3_Accedinfo_Source2_radioButton.Checked = true;
		this.P3_Accedinfo_Source2_radioButton.Name = "P3_Accedinfo_Source2_radioButton";
		this.P3_Accedinfo_Source2_radioButton.TabStop = true;
		this.P3_Accedinfo_Source2_radioButton.UseVisualStyleBackColor = true;
		this.P3_Accedinfo_Source2_radioButton.CheckedChanged += new System.EventHandler(P3_Accedinfo_Sourcex_radioButton_CheckedChanged);
		resources.ApplyResources(this.P3_Accedinfo_Source0_radioButton, "P3_Accedinfo_Source0_radioButton");
		this.P3_Accedinfo_Source0_radioButton.Checked = true;
		this.P3_Accedinfo_Source0_radioButton.Name = "P3_Accedinfo_Source0_radioButton";
		this.P3_Accedinfo_Source0_radioButton.TabStop = true;
		this.P3_Accedinfo_Source0_radioButton.UseVisualStyleBackColor = true;
		this.P3_Accedinfo_Source0_radioButton.CheckedChanged += new System.EventHandler(P3_Accedinfo_Sourcex_radioButton_CheckedChanged);
		resources.ApplyResources(this.P3_Accedinfo_Source1_radioButton, "P3_Accedinfo_Source1_radioButton");
		this.P3_Accedinfo_Source1_radioButton.Name = "P3_Accedinfo_Source1_radioButton";
		this.P3_Accedinfo_Source1_radioButton.UseVisualStyleBackColor = true;
		this.P3_Accedinfo_Source1_radioButton.CheckedChanged += new System.EventHandler(P3_Accedinfo_Sourcex_radioButton_CheckedChanged);
		this.P3_1_panel.Controls.Add(this.P3_label3);
		this.P3_1_panel.Controls.Add(this.P3_noPLUinfo_Font0_radioButton);
		this.P3_1_panel.Controls.Add(this.P3_noPLUinfo_Font1_radioButton);
		this.P3_1_panel.Controls.Add(this.P3_noPLUinfo_Font2_radioButton);
		this.P3_1_panel.Controls.Add(this.P3_noPLUinfo_Font3_radioButton);
		resources.ApplyResources(this.P3_1_panel, "P3_1_panel");
		this.P3_1_panel.Name = "P3_1_panel";
		resources.ApplyResources(this.P3_label3, "P3_label3");
		this.P3_label3.Name = "P3_label3";
		resources.ApplyResources(this.P3_noPLUinfo_Font0_radioButton, "P3_noPLUinfo_Font0_radioButton");
		this.P3_noPLUinfo_Font0_radioButton.Checked = true;
		this.P3_noPLUinfo_Font0_radioButton.Name = "P3_noPLUinfo_Font0_radioButton";
		this.P3_noPLUinfo_Font0_radioButton.TabStop = true;
		this.P3_noPLUinfo_Font0_radioButton.UseVisualStyleBackColor = true;
		this.P3_noPLUinfo_Font0_radioButton.CheckedChanged += new System.EventHandler(P3_noPLUinfo_Fontx_radioButton_CheckedChanged);
		resources.ApplyResources(this.P3_noPLUinfo_Font1_radioButton, "P3_noPLUinfo_Font1_radioButton");
		this.P3_noPLUinfo_Font1_radioButton.Name = "P3_noPLUinfo_Font1_radioButton";
		this.P3_noPLUinfo_Font1_radioButton.UseVisualStyleBackColor = true;
		this.P3_noPLUinfo_Font1_radioButton.CheckedChanged += new System.EventHandler(P3_noPLUinfo_Fontx_radioButton_CheckedChanged);
		resources.ApplyResources(this.P3_noPLUinfo_Font2_radioButton, "P3_noPLUinfo_Font2_radioButton");
		this.P3_noPLUinfo_Font2_radioButton.Name = "P3_noPLUinfo_Font2_radioButton";
		this.P3_noPLUinfo_Font2_radioButton.UseVisualStyleBackColor = true;
		this.P3_noPLUinfo_Font2_radioButton.CheckedChanged += new System.EventHandler(P3_noPLUinfo_Fontx_radioButton_CheckedChanged);
		resources.ApplyResources(this.P3_noPLUinfo_Font3_radioButton, "P3_noPLUinfo_Font3_radioButton");
		this.P3_noPLUinfo_Font3_radioButton.Name = "P3_noPLUinfo_Font3_radioButton";
		this.P3_noPLUinfo_Font3_radioButton.UseVisualStyleBackColor = true;
		this.P3_noPLUinfo_Font3_radioButton.CheckedChanged += new System.EventHandler(P3_noPLUinfo_Fontx_radioButton_CheckedChanged);
		this.P3_PLUinfo_groupBox.Controls.Add(this.P3_PLUinfo_S2_comboBox);
		this.P3_PLUinfo_groupBox.Controls.Add(this.P3_PLUinfo_S1_comboBox);
		this.P3_PLUinfo_groupBox.Controls.Add(this.P3_DoubleSource_checkBox);
		this.P3_PLUinfo_groupBox.Controls.Add(this.P3_PLUinfo_Font3_radioButton);
		this.P3_PLUinfo_groupBox.Controls.Add(this.P3_PLUinfo_Font2_radioButton);
		this.P3_PLUinfo_groupBox.Controls.Add(this.P3_PLUinfo_Font1_radioButton);
		this.P3_PLUinfo_groupBox.Controls.Add(this.P3_label2);
		this.P3_PLUinfo_groupBox.Controls.Add(this.P3_label1);
		this.P3_PLUinfo_groupBox.Controls.Add(this.P3_PLUinfo_Font0_radioButton);
		resources.ApplyResources(this.P3_PLUinfo_groupBox, "P3_PLUinfo_groupBox");
		this.P3_PLUinfo_groupBox.Name = "P3_PLUinfo_groupBox";
		this.P3_PLUinfo_groupBox.TabStop = false;
		this.P3_PLUinfo_S2_comboBox.DropDownWidth = 200;
		this.P3_PLUinfo_S2_comboBox.FormattingEnabled = true;
		resources.ApplyResources(this.P3_PLUinfo_S2_comboBox, "P3_PLUinfo_S2_comboBox");
		this.P3_PLUinfo_S2_comboBox.Name = "P3_PLUinfo_S2_comboBox";
		this.P3_PLUinfo_S2_comboBox.SelectedValueChanged += new System.EventHandler(P3_DoubleSource_checkBox_CheckedChanged);
		this.P3_PLUinfo_S1_comboBox.DropDownWidth = 200;
		this.P3_PLUinfo_S1_comboBox.FormattingEnabled = true;
		resources.ApplyResources(this.P3_PLUinfo_S1_comboBox, "P3_PLUinfo_S1_comboBox");
		this.P3_PLUinfo_S1_comboBox.Name = "P3_PLUinfo_S1_comboBox";
		this.P3_PLUinfo_S1_comboBox.SelectedValueChanged += new System.EventHandler(P3_DoubleSource_checkBox_CheckedChanged);
		resources.ApplyResources(this.P3_DoubleSource_checkBox, "P3_DoubleSource_checkBox");
		this.P3_DoubleSource_checkBox.Name = "P3_DoubleSource_checkBox";
		this.P3_DoubleSource_checkBox.UseVisualStyleBackColor = true;
		this.P3_DoubleSource_checkBox.CheckedChanged += new System.EventHandler(P3_DoubleSource_checkBox_CheckedChanged);
		resources.ApplyResources(this.P3_PLUinfo_Font3_radioButton, "P3_PLUinfo_Font3_radioButton");
		this.P3_PLUinfo_Font3_radioButton.Name = "P3_PLUinfo_Font3_radioButton";
		this.P3_PLUinfo_Font3_radioButton.UseVisualStyleBackColor = true;
		this.P3_PLUinfo_Font3_radioButton.CheckedChanged += new System.EventHandler(P3_PLUinfo_Fontx_radioButton_CheckedChanged);
		resources.ApplyResources(this.P3_PLUinfo_Font2_radioButton, "P3_PLUinfo_Font2_radioButton");
		this.P3_PLUinfo_Font2_radioButton.Name = "P3_PLUinfo_Font2_radioButton";
		this.P3_PLUinfo_Font2_radioButton.UseVisualStyleBackColor = true;
		this.P3_PLUinfo_Font2_radioButton.CheckedChanged += new System.EventHandler(P3_PLUinfo_Fontx_radioButton_CheckedChanged);
		resources.ApplyResources(this.P3_PLUinfo_Font1_radioButton, "P3_PLUinfo_Font1_radioButton");
		this.P3_PLUinfo_Font1_radioButton.Name = "P3_PLUinfo_Font1_radioButton";
		this.P3_PLUinfo_Font1_radioButton.UseVisualStyleBackColor = true;
		this.P3_PLUinfo_Font1_radioButton.CheckedChanged += new System.EventHandler(P3_PLUinfo_Fontx_radioButton_CheckedChanged);
		resources.ApplyResources(this.P3_label2, "P3_label2");
		this.P3_label2.Name = "P3_label2";
		resources.ApplyResources(this.P3_label1, "P3_label1");
		this.P3_label1.Name = "P3_label1";
		resources.ApplyResources(this.P3_PLUinfo_Font0_radioButton, "P3_PLUinfo_Font0_radioButton");
		this.P3_PLUinfo_Font0_radioButton.Checked = true;
		this.P3_PLUinfo_Font0_radioButton.Name = "P3_PLUinfo_Font0_radioButton";
		this.P3_PLUinfo_Font0_radioButton.TabStop = true;
		this.P3_PLUinfo_Font0_radioButton.UseVisualStyleBackColor = true;
		this.P3_PLUinfo_Font0_radioButton.CheckedChanged += new System.EventHandler(P3_PLUinfo_Fontx_radioButton_CheckedChanged);
		this.plu_panel.Controls.Add(this.P7_panel);
		resources.ApplyResources(this.plu_panel, "plu_panel");
		this.plu_panel.Name = "plu_panel";
		resources.ApplyResources(this.P7_panel, "P7_panel");
		this.P7_panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.P7_panel.Controls.Add(this.pLUDataGridView);
		this.P7_panel.Controls.Add(this.pLUBindingNavigator);
		this.P7_panel.Name = "P7_panel";
		this.pLUDataGridView.AllowUserToAddRows = false;
		this.pLUDataGridView.AutoGenerateColumns = false;
		this.pLUDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.pLUDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.pLUDataGridView, "pLUDataGridView");
		this.pLUDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.pLUDataGridView.Columns.AddRange(this.pluidDataGridViewTextBoxColumn, this.validDataGridViewCheckBoxColumn, this.nameDataGridViewTextBoxColumn, this.unitidDataGridViewTextBoxColumn, this.priceDataGridViewTextBoxColumn, this.remarkDataGridViewTextBoxColumn, this.indexDataGridViewTextBoxColumn, this.ps_ud_DataGridViewTextBoxColumn, this.pc_ud_DataGridViewTextBoxColumn, this.costDataGridViewTextBoxColumn, this.tareDataGridViewTextBoxColumn, this.classidDataGridViewTextBoxColumn, this.taxtypeDataGridViewTextBoxColumn, this.taxtextDataGridViewTextBoxColumn, this.labelID1DataGridViewTextBoxColumn, this.barT1DataGridViewTextBoxColumn, this.barF1DataGridViewTextBoxColumn, this.labelID2DataGridViewTextBoxColumn, this.barT2DataGridViewTextBoxColumn, this.barF2DataGridViewTextBoxColumn, this.bitmapDataGridViewComboBoxColumn, this.text1DataGridViewTextBoxColumn, this.text2DataGridViewTextBoxColumn, this.text3DataGridViewTextBoxColumn, this.text4DataGridViewTextBoxColumn, this.text5DataGridViewTextBoxColumn, this.text6DataGridViewTextBoxColumn, this.text7DataGridViewTextBoxColumn, this.sspValue1DataGridViewTextBoxColumn, this.sspValue2DataGridViewTextBoxColumn, this.sspValue3DataGridViewTextBoxColumn, this.sspValue4DataGridViewTextBoxColumn);
		this.pLUDataGridView.DataSource = this.pLUBindingSource;
		this.pLUDataGridView.Name = "pLUDataGridView";
		this.pLUDataGridView.RowTemplate.Height = 23;
		this.pLUDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.pLUDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(pLUDataGridView_DataError);
		this.pluidDataGridViewTextBoxColumn.DataPropertyName = "PLUID";
		this.pluidDataGridViewTextBoxColumn.Frozen = true;
		resources.ApplyResources(this.pluidDataGridViewTextBoxColumn, "pluidDataGridViewTextBoxColumn");
		this.pluidDataGridViewTextBoxColumn.Name = "pluidDataGridViewTextBoxColumn";
		this.validDataGridViewCheckBoxColumn.DataPropertyName = "Valid";
		resources.ApplyResources(this.validDataGridViewCheckBoxColumn, "validDataGridViewCheckBoxColumn");
		this.validDataGridViewCheckBoxColumn.Name = "validDataGridViewCheckBoxColumn";
		this.validDataGridViewCheckBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.nameDataGridViewTextBoxColumn.DataPropertyName = "Name";
		resources.ApplyResources(this.nameDataGridViewTextBoxColumn, "nameDataGridViewTextBoxColumn");
		this.nameDataGridViewTextBoxColumn.Name = "nameDataGridViewTextBoxColumn";
		this.unitidDataGridViewTextBoxColumn.DataPropertyName = "UnitID";
		this.unitidDataGridViewTextBoxColumn.DataSource = this.unitBindingSource;
		this.unitidDataGridViewTextBoxColumn.DisplayMember = "Name";
		resources.ApplyResources(this.unitidDataGridViewTextBoxColumn, "unitidDataGridViewTextBoxColumn");
		this.unitidDataGridViewTextBoxColumn.Name = "unitidDataGridViewTextBoxColumn";
		this.unitidDataGridViewTextBoxColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.unitidDataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.unitidDataGridViewTextBoxColumn.ValueMember = "UnitID";
		this.unitBindingSource.DataMember = "Unit";
		this.unitBindingSource.DataSource = this.eCSDataSet;
		this.unitBindingSource.Sort = "UnitID";
		this.priceDataGridViewTextBoxColumn.DataPropertyName = "Price";
		dataGridViewCellStyle.NullValue = null;
		this.priceDataGridViewTextBoxColumn.DefaultCellStyle = dataGridViewCellStyle;
		resources.ApplyResources(this.priceDataGridViewTextBoxColumn, "priceDataGridViewTextBoxColumn");
		this.priceDataGridViewTextBoxColumn.Name = "priceDataGridViewTextBoxColumn";
		this.remarkDataGridViewTextBoxColumn.DataPropertyName = "Remark";
		resources.ApplyResources(this.remarkDataGridViewTextBoxColumn, "remarkDataGridViewTextBoxColumn");
		this.remarkDataGridViewTextBoxColumn.Name = "remarkDataGridViewTextBoxColumn";
		this.indexDataGridViewTextBoxColumn.DataPropertyName = "Index";
		resources.ApplyResources(this.indexDataGridViewTextBoxColumn, "indexDataGridViewTextBoxColumn");
		this.indexDataGridViewTextBoxColumn.Name = "indexDataGridViewTextBoxColumn";
		this.ps_ud_DataGridViewTextBoxColumn.DataPropertyName = "PS_UD";
		this.ps_ud_DataGridViewTextBoxColumn.DataSource = this.pLUPSDateBindingSource;
		this.ps_ud_DataGridViewTextBoxColumn.DisplayMember = "Display";
		resources.ApplyResources(this.ps_ud_DataGridViewTextBoxColumn, "ps_ud_DataGridViewTextBoxColumn");
		this.ps_ud_DataGridViewTextBoxColumn.Name = "ps_ud_DataGridViewTextBoxColumn";
		this.ps_ud_DataGridViewTextBoxColumn.ValueMember = "Value";
		this.pLUPSDateBindingSource.DataMember = "PLU_PS_Date";
		this.pLUPSDateBindingSource.DataSource = this.uIDataSet;
		this.pLUPSDateBindingSource.Sort = "Value";
		this.pc_ud_DataGridViewTextBoxColumn.DataPropertyName = "PC_UD";
		resources.ApplyResources(this.pc_ud_DataGridViewTextBoxColumn, "pc_ud_DataGridViewTextBoxColumn");
		this.pc_ud_DataGridViewTextBoxColumn.Name = "pc_ud_DataGridViewTextBoxColumn";
		this.costDataGridViewTextBoxColumn.DataPropertyName = "Cost";
		resources.ApplyResources(this.costDataGridViewTextBoxColumn, "costDataGridViewTextBoxColumn");
		this.costDataGridViewTextBoxColumn.Name = "costDataGridViewTextBoxColumn";
		this.tareDataGridViewTextBoxColumn.DataPropertyName = "Tare";
		resources.ApplyResources(this.tareDataGridViewTextBoxColumn, "tareDataGridViewTextBoxColumn");
		this.tareDataGridViewTextBoxColumn.Name = "tareDataGridViewTextBoxColumn";
		this.classidDataGridViewTextBoxColumn.DataPropertyName = "ClassID";
		this.classidDataGridViewTextBoxColumn.DataSource = this.classBindingSource;
		this.classidDataGridViewTextBoxColumn.DisplayMember = "Name";
		resources.ApplyResources(this.classidDataGridViewTextBoxColumn, "classidDataGridViewTextBoxColumn");
		this.classidDataGridViewTextBoxColumn.Name = "classidDataGridViewTextBoxColumn";
		this.classidDataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.classidDataGridViewTextBoxColumn.ValueMember = "ClassID";
		this.classBindingSource.DataMember = "Class";
		this.classBindingSource.DataSource = this.eCSDataSet;
		this.classBindingSource.Sort = "ClassID";
		this.taxtypeDataGridViewTextBoxColumn.DataPropertyName = "TaxType";
		this.taxtypeDataGridViewTextBoxColumn.DataSource = this.pLU_TaxTypeBindingSource;
		this.taxtypeDataGridViewTextBoxColumn.DisplayMember = "Display";
		resources.ApplyResources(this.taxtypeDataGridViewTextBoxColumn, "taxtypeDataGridViewTextBoxColumn");
		this.taxtypeDataGridViewTextBoxColumn.Name = "taxtypeDataGridViewTextBoxColumn";
		this.taxtypeDataGridViewTextBoxColumn.ValueMember = "Value";
		this.pLU_TaxTypeBindingSource.DataMember = "PLU_TaxType";
		this.pLU_TaxTypeBindingSource.DataSource = this.uIDataSet;
		this.pLU_TaxTypeBindingSource.Sort = "Value";
		this.taxtextDataGridViewTextBoxColumn.DataPropertyName = "Tax";
		resources.ApplyResources(this.taxtextDataGridViewTextBoxColumn, "taxtextDataGridViewTextBoxColumn");
		this.taxtextDataGridViewTextBoxColumn.Name = "taxtextDataGridViewTextBoxColumn";
		this.labelID1DataGridViewTextBoxColumn.DataPropertyName = "LabelID1";
		this.labelID1DataGridViewTextBoxColumn.DataSource = this.labelBindingSource1;
		this.labelID1DataGridViewTextBoxColumn.DisplayMember = "Name";
		resources.ApplyResources(this.labelID1DataGridViewTextBoxColumn, "labelID1DataGridViewTextBoxColumn");
		this.labelID1DataGridViewTextBoxColumn.Name = "labelID1DataGridViewTextBoxColumn";
		this.labelID1DataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.labelID1DataGridViewTextBoxColumn.ValueMember = "LabelID";
		this.labelBindingSource1.DataMember = "Label";
		this.labelBindingSource1.DataSource = this.eCSDataSet;
		this.labelBindingSource1.Filter = "LabelID >=0 AND LabelID <= 29";
		this.labelBindingSource1.Sort = "LabelID";
		this.barT1DataGridViewTextBoxColumn.DataPropertyName = "BarT1";
		this.barT1DataGridViewTextBoxColumn.DataSource = this.barcodeBindingSource1;
		this.barT1DataGridViewTextBoxColumn.DisplayMember = "Name";
		resources.ApplyResources(this.barT1DataGridViewTextBoxColumn, "barT1DataGridViewTextBoxColumn");
		this.barT1DataGridViewTextBoxColumn.Name = "barT1DataGridViewTextBoxColumn";
		this.barT1DataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.barT1DataGridViewTextBoxColumn.ValueMember = "BarID";
		this.barcodeBindingSource1.DataMember = "Barcode";
		this.barcodeBindingSource1.DataSource = this.eCSDataSet;
		this.barcodeBindingSource1.Sort = "BarID";
		this.barF1DataGridViewTextBoxColumn.DataPropertyName = "BarF1";
		resources.ApplyResources(this.barF1DataGridViewTextBoxColumn, "barF1DataGridViewTextBoxColumn");
		this.barF1DataGridViewTextBoxColumn.Name = "barF1DataGridViewTextBoxColumn";
		this.labelID2DataGridViewTextBoxColumn.DataPropertyName = "LabelID2";
		this.labelID2DataGridViewTextBoxColumn.DataSource = this.labelBindingSource2;
		this.labelID2DataGridViewTextBoxColumn.DisplayMember = "Name";
		resources.ApplyResources(this.labelID2DataGridViewTextBoxColumn, "labelID2DataGridViewTextBoxColumn");
		this.labelID2DataGridViewTextBoxColumn.Name = "labelID2DataGridViewTextBoxColumn";
		this.labelID2DataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.labelID2DataGridViewTextBoxColumn.ValueMember = "LabelID";
		this.labelBindingSource2.DataMember = "Label";
		this.labelBindingSource2.DataSource = this.eCSDataSet;
		this.labelBindingSource2.Filter = "LabelID >=0 AND LabelID <= 29";
		this.labelBindingSource2.Sort = "LabelID";
		this.barT2DataGridViewTextBoxColumn.DataPropertyName = "BarT2";
		this.barT2DataGridViewTextBoxColumn.DataSource = this.barcodeBindingSource2;
		this.barT2DataGridViewTextBoxColumn.DisplayMember = "Name";
		resources.ApplyResources(this.barT2DataGridViewTextBoxColumn, "barT2DataGridViewTextBoxColumn");
		this.barT2DataGridViewTextBoxColumn.Name = "barT2DataGridViewTextBoxColumn";
		this.barT2DataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.barT2DataGridViewTextBoxColumn.ValueMember = "BarID";
		this.barcodeBindingSource2.DataMember = "Barcode";
		this.barcodeBindingSource2.DataSource = this.eCSDataSet;
		this.barcodeBindingSource2.Sort = "BarID";
		this.barF2DataGridViewTextBoxColumn.DataPropertyName = "BarF2";
		resources.ApplyResources(this.barF2DataGridViewTextBoxColumn, "barF2DataGridViewTextBoxColumn");
		this.barF2DataGridViewTextBoxColumn.Name = "barF2DataGridViewTextBoxColumn";
		this.bitmapDataGridViewComboBoxColumn.DataPropertyName = "Bitmap";
		this.bitmapDataGridViewComboBoxColumn.DataSource = this.bitmapBindingSource2;
		this.bitmapDataGridViewComboBoxColumn.DisplayMember = "Des";
		resources.ApplyResources(this.bitmapDataGridViewComboBoxColumn, "bitmapDataGridViewComboBoxColumn");
		this.bitmapDataGridViewComboBoxColumn.Name = "bitmapDataGridViewComboBoxColumn";
		this.bitmapDataGridViewComboBoxColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.bitmapDataGridViewComboBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.bitmapDataGridViewComboBoxColumn.ValueMember = "ID";
		this.bitmapBindingSource2.AllowNew = false;
		this.bitmapBindingSource2.DataMember = "Bitmap";
		this.bitmapBindingSource2.DataSource = this.eCSDataSet;
		this.text1DataGridViewTextBoxColumn.DataPropertyName = "Text1";
		resources.ApplyResources(this.text1DataGridViewTextBoxColumn, "text1DataGridViewTextBoxColumn");
		this.text1DataGridViewTextBoxColumn.Name = "text1DataGridViewTextBoxColumn";
		this.text2DataGridViewTextBoxColumn.DataPropertyName = "Text2";
		resources.ApplyResources(this.text2DataGridViewTextBoxColumn, "text2DataGridViewTextBoxColumn");
		this.text2DataGridViewTextBoxColumn.Name = "text2DataGridViewTextBoxColumn";
		this.text3DataGridViewTextBoxColumn.DataPropertyName = "Text3";
		resources.ApplyResources(this.text3DataGridViewTextBoxColumn, "text3DataGridViewTextBoxColumn");
		this.text3DataGridViewTextBoxColumn.Name = "text3DataGridViewTextBoxColumn";
		this.text4DataGridViewTextBoxColumn.DataPropertyName = "Text4";
		resources.ApplyResources(this.text4DataGridViewTextBoxColumn, "text4DataGridViewTextBoxColumn");
		this.text4DataGridViewTextBoxColumn.Name = "text4DataGridViewTextBoxColumn";
		this.text5DataGridViewTextBoxColumn.DataPropertyName = "Text5";
		resources.ApplyResources(this.text5DataGridViewTextBoxColumn, "text5DataGridViewTextBoxColumn");
		this.text5DataGridViewTextBoxColumn.Name = "text5DataGridViewTextBoxColumn";
		this.text6DataGridViewTextBoxColumn.DataPropertyName = "Text6";
		resources.ApplyResources(this.text6DataGridViewTextBoxColumn, "text6DataGridViewTextBoxColumn");
		this.text6DataGridViewTextBoxColumn.Name = "text6DataGridViewTextBoxColumn";
		this.text7DataGridViewTextBoxColumn.DataPropertyName = "Text7";
		resources.ApplyResources(this.text7DataGridViewTextBoxColumn, "text7DataGridViewTextBoxColumn");
		this.text7DataGridViewTextBoxColumn.Name = "text7DataGridViewTextBoxColumn";
		this.sspValue1DataGridViewTextBoxColumn.DataPropertyName = "SspValue1";
		resources.ApplyResources(this.sspValue1DataGridViewTextBoxColumn, "sspValue1DataGridViewTextBoxColumn");
		this.sspValue1DataGridViewTextBoxColumn.Name = "sspValue1DataGridViewTextBoxColumn";
		this.sspValue2DataGridViewTextBoxColumn.DataPropertyName = "SspValue2";
		resources.ApplyResources(this.sspValue2DataGridViewTextBoxColumn, "sspValue2DataGridViewTextBoxColumn");
		this.sspValue2DataGridViewTextBoxColumn.Name = "sspValue2DataGridViewTextBoxColumn";
		this.sspValue3DataGridViewTextBoxColumn.DataPropertyName = "SspValue3";
		resources.ApplyResources(this.sspValue3DataGridViewTextBoxColumn, "sspValue3DataGridViewTextBoxColumn");
		this.sspValue3DataGridViewTextBoxColumn.Name = "sspValue3DataGridViewTextBoxColumn";
		this.sspValue4DataGridViewTextBoxColumn.DataPropertyName = "SspValue4";
		resources.ApplyResources(this.sspValue4DataGridViewTextBoxColumn, "sspValue4DataGridViewTextBoxColumn");
		this.sspValue4DataGridViewTextBoxColumn.Name = "sspValue4DataGridViewTextBoxColumn";
		this.pLUBindingSource.DataMember = "PLU";
		this.pLUBindingSource.DataSource = this.eCSDataSet;
		this.pLUBindingSource.Sort = "";
		this.pLUBindingNavigator.AddNewItem = null;
		this.pLUBindingNavigator.BindingSource = this.pLUBindingSource;
		this.pLUBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.pLUBindingNavigator.DeleteItem = null;
		this.pLUBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[15]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem1,
			this.bindingNavigatorDeleteItem1, this.toolStripSeparator1, this.bindingNavigatorID, this.bindingNavigatorGoto, this.pluDataElement_ToolStripButton
		});
		resources.ApplyResources(this.pLUBindingNavigator, "pLUBindingNavigator");
		this.pLUBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.pLUBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.pLUBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.pLUBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.pLUBindingNavigator.Name = "pLUBindingNavigator";
		this.pLUBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		resources.ApplyResources(this.bindingNavigatorCountItem, "bindingNavigatorCountItem");
		this.bindingNavigatorMoveFirstItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveFirstItem.Image = ECS.Properties.Resources.bindingNavigatorMoveFirstItem;
		this.bindingNavigatorMoveFirstItem.Name = "bindingNavigatorMoveFirstItem";
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem, "bindingNavigatorMoveFirstItem");
		this.bindingNavigatorMovePreviousItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMovePreviousItem.Image = ECS.Properties.Resources.bindingNavigatorMovePreviousItem;
		this.bindingNavigatorMovePreviousItem.Name = "bindingNavigatorMovePreviousItem";
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem, "bindingNavigatorMovePreviousItem");
		this.bindingNavigatorSeparator.Name = "bindingNavigatorSeparator";
		resources.ApplyResources(this.bindingNavigatorSeparator, "bindingNavigatorSeparator");
		resources.ApplyResources(this.bindingNavigatorPositionItem, "bindingNavigatorPositionItem");
		this.bindingNavigatorPositionItem.Name = "bindingNavigatorPositionItem";
		this.bindingNavigatorSeparator1.Name = "bindingNavigatorSeparator1";
		resources.ApplyResources(this.bindingNavigatorSeparator1, "bindingNavigatorSeparator1");
		this.bindingNavigatorMoveNextItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveNextItem.Image = ECS.Properties.Resources.bindingNavigatorMoveNextItem;
		this.bindingNavigatorMoveNextItem.Name = "bindingNavigatorMoveNextItem";
		resources.ApplyResources(this.bindingNavigatorMoveNextItem, "bindingNavigatorMoveNextItem");
		this.bindingNavigatorMoveLastItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveLastItem.Image = ECS.Properties.Resources.bindingNavigatorMoveLastItem;
		this.bindingNavigatorMoveLastItem.Name = "bindingNavigatorMoveLastItem";
		resources.ApplyResources(this.bindingNavigatorMoveLastItem, "bindingNavigatorMoveLastItem");
		this.bindingNavigatorSeparator2.Name = "bindingNavigatorSeparator2";
		resources.ApplyResources(this.bindingNavigatorSeparator2, "bindingNavigatorSeparator2");
		this.bindingNavigatorAddNewItem1.Image = ECS.Properties.Resources.bindingNavigatorAddNewItem;
		this.bindingNavigatorAddNewItem1.Name = "bindingNavigatorAddNewItem1";
		resources.ApplyResources(this.bindingNavigatorAddNewItem1, "bindingNavigatorAddNewItem1");
		this.bindingNavigatorAddNewItem1.Click += new System.EventHandler(bindingNavigatorAddNewItem1_Click);
		this.bindingNavigatorDeleteItem1.Image = ECS.Properties.Resources.bindingNavigatorDeleteItem;
		this.bindingNavigatorDeleteItem1.Name = "bindingNavigatorDeleteItem1";
		resources.ApplyResources(this.bindingNavigatorDeleteItem1, "bindingNavigatorDeleteItem1");
		this.bindingNavigatorDeleteItem1.Click += new System.EventHandler(bindingNavigatorDeleteItem1_Click);
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		this.bindingNavigatorID.Name = "bindingNavigatorID";
		resources.ApplyResources(this.bindingNavigatorID, "bindingNavigatorID");
		this.bindingNavigatorGoto.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorGoto.Image = ECS.Properties.Resources.bindingNavigatorGoto;
		resources.ApplyResources(this.bindingNavigatorGoto, "bindingNavigatorGoto");
		this.bindingNavigatorGoto.Name = "bindingNavigatorGoto";
		this.pluDataElement_ToolStripButton.Image = ECS.Properties.Resources.Table;
		resources.ApplyResources(this.pluDataElement_ToolStripButton, "pluDataElement_ToolStripButton");
		this.pluDataElement_ToolStripButton.Name = "pluDataElement_ToolStripButton";
		this.pluDataElement_ToolStripButton.Click += new System.EventHandler(pluDataElement_ToolStripButton_Click);
		this.face_panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.face_panel.Controls.Add(this.splitContainer);
		resources.ApplyResources(this.face_panel, "face_panel");
		this.face_panel.Name = "face_panel";
		this.tmsout_panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.tmsout_panel.Controls.Add(this.export_ethernet_Label);
		this.tmsout_panel.Controls.Add(this.export_usb_Label);
		this.tmsout_panel.Controls.Add(this.export_ethernet_PictureBox);
		this.tmsout_panel.Controls.Add(this.export_usb_PictureBox);
		resources.ApplyResources(this.tmsout_panel, "tmsout_panel");
		this.tmsout_panel.Name = "tmsout_panel";
		this.export_ethernet_Label.BackColor = System.Drawing.Color.Transparent;
		resources.ApplyResources(this.export_ethernet_Label, "export_ethernet_Label");
		this.export_ethernet_Label.Name = "export_ethernet_Label";
		this.export_ethernet_Label.Click += new System.EventHandler(export_ethernet_PictureBox_Click);
		this.export_ethernet_Label.MouseEnter += new System.EventHandler(export_ethernet_PictureBox_MouseEnter);
		this.export_ethernet_Label.MouseLeave += new System.EventHandler(export_ethernet_PictureBox_MouseLeave);
		this.export_usb_Label.BackColor = System.Drawing.Color.Transparent;
		resources.ApplyResources(this.export_usb_Label, "export_usb_Label");
		this.export_usb_Label.Name = "export_usb_Label";
		this.export_usb_Label.Click += new System.EventHandler(export_usb_PictureBox_Click);
		this.export_usb_Label.MouseEnter += new System.EventHandler(export_usb_PictureBox_MouseEnter);
		this.export_usb_Label.MouseLeave += new System.EventHandler(export_usb_PictureBox_MouseLeave);
		resources.ApplyResources(this.export_ethernet_PictureBox, "export_ethernet_PictureBox");
		this.export_ethernet_PictureBox.Name = "export_ethernet_PictureBox";
		this.export_ethernet_PictureBox.TabStop = false;
		this.export_ethernet_PictureBox.Click += new System.EventHandler(export_ethernet_PictureBox_Click);
		this.export_ethernet_PictureBox.MouseEnter += new System.EventHandler(export_ethernet_PictureBox_MouseEnter);
		this.export_ethernet_PictureBox.MouseLeave += new System.EventHandler(export_ethernet_PictureBox_MouseLeave);
		resources.ApplyResources(this.export_usb_PictureBox, "export_usb_PictureBox");
		this.export_usb_PictureBox.Name = "export_usb_PictureBox";
		this.export_usb_PictureBox.TabStop = false;
		this.export_usb_PictureBox.Click += new System.EventHandler(export_usb_PictureBox_Click);
		this.export_usb_PictureBox.MouseEnter += new System.EventHandler(export_usb_PictureBox_MouseEnter);
		this.export_usb_PictureBox.MouseLeave += new System.EventHandler(export_usb_PictureBox_MouseLeave);
		resources.ApplyResources(this.panel12, "panel12");
		this.panel12.Name = "panel12";
		resources.ApplyResources(this.panel13, "panel13");
		this.panel13.Name = "panel13";
		this.panel14.Controls.Add(this.label1);
		resources.ApplyResources(this.panel14, "panel14");
		this.panel14.Name = "panel14";
		resources.ApplyResources(this.label1, "label1");
		this.label1.Name = "label1";
		resources.ApplyResources(this.panel2, "panel2");
		this.panel2.Name = "panel2";
		resources.ApplyResources(this.panel15, "panel15");
		this.panel15.Name = "panel15";
		resources.ApplyResources(this.panel16, "panel16");
		this.panel16.Name = "panel16";
		resources.ApplyResources(this.panel17, "panel17");
		this.panel17.Name = "panel17";
		resources.ApplyResources(this.panel3, "panel3");
		this.panel3.Name = "panel3";
		this.opMain_Panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.opMain_Panel.Controls.Add(this.OpMain_SCP_CheckBox);
		this.opMain_Panel.Controls.Add(this.OpMain_PLU_CheckBox);
		this.opMain_Panel.Controls.Add(this.OpMain_UnitDisplay_CheckBox);
		this.opMain_Panel.Controls.Add(this.OpMain_SaleOperation_CheckBox);
		this.opMain_Panel.Controls.Add(this.OpMain_Management_CheckBox);
		this.opMain_Panel.Controls.Add(this.OpMain_LabelBarcode_CheckBox);
		this.opMain_Panel.Controls.Add(this.versionTip_Label);
		this.opMain_Panel.Controls.Add(this.OpMain_FirstConfig_radioButton);
		this.opMain_Panel.Controls.Add(this.OpMain_TMSout_radioButton);
		this.opMain_Panel.Controls.Add(this.OpMain_WorkData_radioButton);
		this.opMain_Panel.Controls.Add(this.reset_Button);
		resources.ApplyResources(this.opMain_Panel, "opMain_Panel");
		this.opMain_Panel.Name = "opMain_Panel";
		resources.ApplyResources(this.OpMain_SCP_CheckBox, "OpMain_SCP_CheckBox");
		this.OpMain_SCP_CheckBox.Name = "OpMain_SCP_CheckBox";
		this.OpMain_SCP_CheckBox.UseVisualStyleBackColor = true;
		this.OpMain_SCP_CheckBox.CheckedChanged += new System.EventHandler(OpMain_Changed);
		resources.ApplyResources(this.OpMain_PLU_CheckBox, "OpMain_PLU_CheckBox");
		this.OpMain_PLU_CheckBox.Name = "OpMain_PLU_CheckBox";
		this.OpMain_PLU_CheckBox.UseVisualStyleBackColor = true;
		this.OpMain_PLU_CheckBox.CheckedChanged += new System.EventHandler(OpMain_Changed);
		resources.ApplyResources(this.OpMain_UnitDisplay_CheckBox, "OpMain_UnitDisplay_CheckBox");
		this.OpMain_UnitDisplay_CheckBox.Name = "OpMain_UnitDisplay_CheckBox";
		this.OpMain_UnitDisplay_CheckBox.UseVisualStyleBackColor = true;
		this.OpMain_UnitDisplay_CheckBox.CheckedChanged += new System.EventHandler(OpMain_Changed);
		resources.ApplyResources(this.OpMain_SaleOperation_CheckBox, "OpMain_SaleOperation_CheckBox");
		this.OpMain_SaleOperation_CheckBox.Name = "OpMain_SaleOperation_CheckBox";
		this.OpMain_SaleOperation_CheckBox.UseVisualStyleBackColor = true;
		this.OpMain_SaleOperation_CheckBox.CheckedChanged += new System.EventHandler(OpMain_Changed);
		resources.ApplyResources(this.OpMain_Management_CheckBox, "OpMain_Management_CheckBox");
		this.OpMain_Management_CheckBox.Name = "OpMain_Management_CheckBox";
		this.OpMain_Management_CheckBox.UseVisualStyleBackColor = true;
		this.OpMain_Management_CheckBox.CheckedChanged += new System.EventHandler(OpMain_Changed);
		resources.ApplyResources(this.OpMain_LabelBarcode_CheckBox, "OpMain_LabelBarcode_CheckBox");
		this.OpMain_LabelBarcode_CheckBox.Name = "OpMain_LabelBarcode_CheckBox";
		this.OpMain_LabelBarcode_CheckBox.UseVisualStyleBackColor = true;
		this.OpMain_LabelBarcode_CheckBox.CheckedChanged += new System.EventHandler(OpMain_Changed);
		resources.ApplyResources(this.versionTip_Label, "versionTip_Label");
		this.versionTip_Label.ForeColor = System.Drawing.Color.Red;
		this.versionTip_Label.Name = "versionTip_Label";
		resources.ApplyResources(this.OpMain_FirstConfig_radioButton, "OpMain_FirstConfig_radioButton");
		this.OpMain_FirstConfig_radioButton.Name = "OpMain_FirstConfig_radioButton";
		this.OpMain_FirstConfig_radioButton.TabStop = true;
		this.OpMain_FirstConfig_radioButton.UseVisualStyleBackColor = true;
		this.OpMain_FirstConfig_radioButton.CheckedChanged += new System.EventHandler(OpMain_Changed);
		resources.ApplyResources(this.OpMain_TMSout_radioButton, "OpMain_TMSout_radioButton");
		this.OpMain_TMSout_radioButton.Name = "OpMain_TMSout_radioButton";
		this.OpMain_TMSout_radioButton.TabStop = true;
		this.OpMain_TMSout_radioButton.UseVisualStyleBackColor = true;
		this.OpMain_TMSout_radioButton.CheckedChanged += new System.EventHandler(OpMain_Changed);
		resources.ApplyResources(this.OpMain_WorkData_radioButton, "OpMain_WorkData_radioButton");
		this.OpMain_WorkData_radioButton.Name = "OpMain_WorkData_radioButton";
		this.OpMain_WorkData_radioButton.TabStop = true;
		this.OpMain_WorkData_radioButton.UseVisualStyleBackColor = true;
		this.OpMain_WorkData_radioButton.CheckedChanged += new System.EventHandler(OpMain_Changed);
		resources.ApplyResources(this.reset_Button, "reset_Button");
		this.reset_Button.Name = "reset_Button";
		this.reset_Button.UseVisualStyleBackColor = true;
		this.reset_Button.Click += new System.EventHandler(reset_Button_Click);
		this.labelItemTableAdapter.ClearBeforeFill = true;
		this.labelTableAdapter.ClearBeforeFill = true;
		this.labelSortBindingSource.DataMember = "Label_Sort";
		this.labelSortBindingSource.DataSource = this.uIDataSet;
		this.labelSortBindingSource.Sort = "Value";
		this.labelVersionBindingSource.DataMember = "Label_Version";
		this.labelVersionBindingSource.DataSource = this.uIDataSet;
		this.labelVersionBindingSource.Sort = "Value";
		this.blink_Timer.Enabled = true;
		this.blink_Timer.Interval = 300;
		this.blink_Timer.Tick += new System.EventHandler(blink_Timer_Tick);
		this.stringTableAdapter.ClearBeforeFill = true;
		this.pluTableAdapter.ClearBeforeFill = true;
		this.faceTableAdapter.ClearBeforeFill = true;
		this.faceListTableAdapter.ClearBeforeFill = true;
		this.classTableAdapter.ClearBeforeFill = true;
		this.barcodeTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this.P5_BuyBack_A512_checkBox, "P5_BuyBack_A512_checkBox");
		this.P5_BuyBack_A512_checkBox.Name = "P5_BuyBack_A512_checkBox";
		this.P5_BuyBack_A512_checkBox.UseVisualStyleBackColor = true;
		this.P5_BuyBack_A512_checkBox.CheckedChanged += new System.EventHandler(P5_BuyBack_A2_checkBox_CheckedChanged);
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.Main_panel);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "WizardForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(WizardForm_FormClosing);
		base.Load += new System.EventHandler(WizardForm_Load);
		this.pt_Left_SplitContainer.Panel1.ResumeLayout(false);
		this.pt_Left_SplitContainer.Panel2.ResumeLayout(false);
		this.pt_Left_SplitContainer.ResumeLayout(false);
		this.pt_LeftUD_SplitContainer.Panel1.ResumeLayout(false);
		this.pt_LeftUD_SplitContainer.Panel2.ResumeLayout(false);
		this.pt_LeftUD_SplitContainer.ResumeLayout(false);
		this.pt_LeftUDU_SplitContainer.Panel1.ResumeLayout(false);
		this.pt_LeftUDU_SplitContainer.Panel1.PerformLayout();
		this.pt_LeftUDU_SplitContainer.Panel2.ResumeLayout(false);
		this.pt_LeftUDU_SplitContainer.Panel2.PerformLayout();
		this.pt_LeftUDU_SplitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.labelDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelBindingNavigator).EndInit();
		this.labelBindingNavigator.ResumeLayout(false);
		this.labelBindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.PPwidthNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PPheightNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PPheightMMNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PPwidthMMNumericUpDown).EndInit();
		this.pt_LeftUDD_SplitContainer.Panel1.ResumeLayout(false);
		this.pt_LeftUDD_SplitContainer.Panel1.PerformLayout();
		this.pt_LeftUDD_SplitContainer.Panel2.ResumeLayout(false);
		this.pt_LeftUDD_SplitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.labelitemDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemBindingNavigator).EndInit();
		this.labelItemBindingNavigator.ResumeLayout(false);
		this.labelItemBindingNavigator.PerformLayout();
		this.panel5.ResumeLayout(false);
		this.panel5.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.labelItemPrintBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemAlignBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemAngleBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemFontBindingSource).EndInit();
		this.pt_Mid_SplitContainer.Panel1.ResumeLayout(false);
		this.pt_Mid_SplitContainer.Panel1.PerformLayout();
		this.pt_Mid_SplitContainer.Panel2.ResumeLayout(false);
		this.pt_Mid_SplitContainer.Panel2.PerformLayout();
		this.pt_Mid_SplitContainer.ResumeLayout(false);
		this.panel1.ResumeLayout(false);
		this.pt_Mid_StatusStrip.ResumeLayout(false);
		this.pt_Mid_StatusStrip.PerformLayout();
		this.pt_Right_SplitContainer.Panel1.ResumeLayout(false);
		this.pt_Right_SplitContainer.Panel2.ResumeLayout(false);
		this.pt_Right_SplitContainer.Panel2.PerformLayout();
		this.pt_Right_SplitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.pt_Sample_PictureBox).EndInit();
		this.tp_Info_TableLayoutPanel.ResumeLayout(false);
		this.pt_InfoTextSample_Panel.ResumeLayout(false);
		this.pt_InfoTextSample_Panel.PerformLayout();
		this.pt_Picture_Panel.ResumeLayout(false);
		this.pt_Picture_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pt_Picture_PictureBox).EndInit();
		this.splitContainer.Panel1.ResumeLayout(false);
		this.splitContainer.Panel2.ResumeLayout(false);
		this.splitContainer.Panel2.PerformLayout();
		this.splitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.faceListBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.scPLUP_bindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.scPLUL_bindingSource).EndInit();
		this.pt_Top_SplitContainer.Panel2.ResumeLayout(false);
		this.pt_Top_SplitContainer.ResumeLayout(false);
		this.pt_Main_SplitContainer.Panel1.ResumeLayout(false);
		this.pt_Main_SplitContainer.Panel2.ResumeLayout(false);
		this.pt_Main_SplitContainer.ResumeLayout(false);
		this.Main_panel.ResumeLayout(false);
		this.tableLayoutPanel.ResumeLayout(false);
		this.tableLayoutPanel.PerformLayout();
		this.pt_Panel.ResumeLayout(false);
		this.Header_panel.ResumeLayout(false);
		this.mode_Panel.ResumeLayout(false);
		this.mode_Panel.PerformLayout();
		this.panel7.ResumeLayout(false);
		this.panel7.PerformLayout();
		this.Mode_GapPapper_Panel.ResumeLayout(false);
		this.Mode_GapPapper_Panel.PerformLayout();
		this.Mode_PlainPapper_Panel.ResumeLayout(false);
		this.Mode_PlainPapper_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.Mode_Gray_numericUpDown).EndInit();
		this.barcode_panel.ResumeLayout(false);
		this.tableLayoutPanel1.ResumeLayout(false);
		this.tableLayoutPanel1.PerformLayout();
		this.barcode_Special_Panel.ResumeLayout(false);
		this.barcode_Special_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.barcodeFormatBindingSource).EndInit();
		this.barcode_CashRegister_Panel.ResumeLayout(false);
		this.P1_Part7_groupBox.ResumeLayout(false);
		this.P1_Part7_groupBox.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.P1_P7_QRVersion_NumericUpDown).EndInit();
		this.P1_Part6_groupBox.ResumeLayout(false);
		this.P1_Part6_groupBox.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.P1_Part6_PcsDecimal_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.P1_Part6_MoneyDecimal_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.P1_Part6_WeightDecimal_NumericUpDown).EndInit();
		this.barcode_CashRegister_Info_Panel.ResumeLayout(false);
		this.barcode_CashRegister_Info_Panel.PerformLayout();
		this.P1_Type_groupBox.ResumeLayout(false);
		this.P1_Type_groupBox.PerformLayout();
		this.P1_Part3_4Sum_groupBox.ResumeLayout(false);
		this.P1_Part3_4Sum_groupBox.PerformLayout();
		this.P1_Part1_2Sum_groupBox.ResumeLayout(false);
		this.P1_Part1_2Sum_groupBox.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.P1_P1_2SumFlag_numericUpDown).EndInit();
		this.P1_Part2_groupBox.ResumeLayout(false);
		this.P1_Part2_groupBox.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.P1_P2Const_numericUpDown).EndInit();
		this.P1_Part5_groupBox.ResumeLayout(false);
		this.P1_Part5_groupBox.PerformLayout();
		this.P1_Part1_groupBox.ResumeLayout(false);
		this.P1_Part1_groupBox.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.P1_P1_ItemFlag_numericUpDown).EndInit();
		this.P1_Part3_groupBox.ResumeLayout(false);
		this.P1_Part3_groupBox.PerformLayout();
		this.P1_Part4_groupBox.ResumeLayout(false);
		this.P1_Part4_groupBox.PerformLayout();
		this.barcode_ManualEdit_Panel.ResumeLayout(false);
		this.barcode_ManualEdit_Panel.PerformLayout();
		this.BarSub_TableLayoutPanel.ResumeLayout(false);
		this.BarSub_TableLayoutPanel.PerformLayout();
		this.view_subpage_panel.ResumeLayout(false);
		this.view_subpage_panel.PerformLayout();
		this.Info_Panel.ResumeLayout(false);
		this.Info_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.BarNum_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeFormat2BindingSource).EndInit();
		this.device_Panel.ResumeLayout(false);
		this.device_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.devicePictureBox).EndInit();
		this.Device_Cxx_Display_Panel.ResumeLayout(false);
		this.Device_Cxx_Display_Panel.PerformLayout();
		this.Device_Axx_Display_Panel.ResumeLayout(false);
		this.Device_Axx_Display_Panel.PerformLayout();
		this.Device_Cxx_Panel.ResumeLayout(false);
		this.Device_Cxx_Panel.PerformLayout();
		this.Device_Axx_Panel.ResumeLayout(false);
		this.Device_Axx_Panel.PerformLayout();
		this.manage_panel.ResumeLayout(false);
		this.manage_panel.PerformLayout();
		this.mg_Detail_Panel.ResumeLayout(false);
		this.P5_ZeroBack_groupBox.ResumeLayout(false);
		this.P5_ZeroBack_groupBox.PerformLayout();
		this.P5_Unconfirmed_groupBox.ResumeLayout(false);
		this.P5_Unconfirmed_groupBox.PerformLayout();
		this.P5_VBuffer_groupBox.ResumeLayout(false);
		this.P5_VBuffer_groupBox.PerformLayout();
		this.P5_TotalPrice_groupBox.ResumeLayout(false);
		this.P5_TotalPrice_groupBox.PerformLayout();
		this.mg_AdminIC_groupBox.ResumeLayout(false);
		this.mg_AdminIC_groupBox.PerformLayout();
		this.P5_UnitPrice_groupBox.ResumeLayout(false);
		this.P5_UnitPrice_groupBox.PerformLayout();
		this.P5_Other_groupBox.ResumeLayout(false);
		this.P5_Other_groupBox.PerformLayout();
		this.mg_Password_groupBox.ResumeLayout(false);
		this.mg_Password_groupBox.PerformLayout();
		this.opconfig_panel.ResumeLayout(false);
		this.P5_ZeroReturn_groupBox.ResumeLayout(false);
		this.P5_ZeroReturn_groupBox.PerformLayout();
		this.P5_BuyBack_groupBox.ResumeLayout(false);
		this.P5_BuyBack_groupBox.PerformLayout();
		this.panel18.ResumeLayout(false);
		this.panel18.PerformLayout();
		this.P5_PriceFProg_groupBox.ResumeLayout(false);
		this.P5_PriceFProg_groupBox.PerformLayout();
		this.P5_Payments_groupBox.ResumeLayout(false);
		this.P5_Payments_groupBox.PerformLayout();
		this.P5_Hangup_groupBox.ResumeLayout(false);
		this.P5_Hangup_groupBox.PerformLayout();
		this.unit_panel.ResumeLayout(false);
		this.P2_UnitSetting_groupBox.ResumeLayout(false);
		this.P2_UnitSetting_groupBox.PerformLayout();
		this.P4_TotalRounding_groupBox.ResumeLayout(false);
		this.P4_TotalRounding_groupBox.PerformLayout();
		this.P4_ItemRounding_groupBox.ResumeLayout(false);
		this.P4_ItemRounding_groupBox.PerformLayout();
		this.P4_UPriceRadixPoint_groupBox.ResumeLayout(false);
		this.P4_UPriceRadixPoint_groupBox.PerformLayout();
		this.P4_TotalRadixPoint_groupBox.ResumeLayout(false);
		this.P4_TotalRadixPoint_groupBox.PerformLayout();
		this.w5th_panel.ResumeLayout(false);
		this.P3_noPLUinfo_groupBox.ResumeLayout(false);
		this.P3_2_panel.ResumeLayout(false);
		this.P3_2_panel.PerformLayout();
		this.panel6.ResumeLayout(false);
		this.panel6.PerformLayout();
		this.P3_1_panel.ResumeLayout(false);
		this.P3_1_panel.PerformLayout();
		this.P3_PLUinfo_groupBox.ResumeLayout(false);
		this.P3_PLUinfo_groupBox.PerformLayout();
		this.plu_panel.ResumeLayout(false);
		this.P7_panel.ResumeLayout(false);
		this.P7_panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLUPSDateBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.classBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLU_TaxTypeBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingSource1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingSource2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.bitmapBindingSource2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingNavigator).EndInit();
		this.pLUBindingNavigator.ResumeLayout(false);
		this.pLUBindingNavigator.PerformLayout();
		this.face_panel.ResumeLayout(false);
		this.tmsout_panel.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.export_ethernet_PictureBox).EndInit();
		((System.ComponentModel.ISupportInitialize)this.export_usb_PictureBox).EndInit();
		this.panel14.ResumeLayout(false);
		this.panel14.PerformLayout();
		this.opMain_Panel.ResumeLayout(false);
		this.opMain_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.labelSortBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelVersionBindingSource).EndInit();
		base.ResumeLayout(false);
	}
}
