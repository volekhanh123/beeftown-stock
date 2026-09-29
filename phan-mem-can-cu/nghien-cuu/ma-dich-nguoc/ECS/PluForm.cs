using System;
using System.ComponentModel;
using System.Configuration;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class PluForm : Form
{
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

	private delegate void DataSet_RefreshCallback(string Type);

	private bool PLUvalidChanged;

	private bool NoCTRowChanged;

	private bool DataSet_Changed;

	private bool timer_ed;

	private IContainer components;

	private ECSDataSet eCSDataSet;

	private BindingSource pLUBindingSource;

	private PLUTableAdapter pLUTableAdapter;

	private BindingNavigator pLUBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem;

	private ToolStripLabel bindingNavigatorCountItem;

	private ToolStripButton bindingNavigatorDeleteItem;

	private ToolStripButton bindingNavigatorMoveFirstItem;

	private ToolStripButton bindingNavigatorMovePreviousItem;

	private ToolStripSeparator bindingNavigatorSeparator;

	private ToolStripTextBox bindingNavigatorPositionItem;

	private ToolStripSeparator bindingNavigatorSeparator1;

	private ToolStripButton bindingNavigatorMoveNextItem;

	private ToolStripButton bindingNavigatorMoveLastItem;

	private ToolStripSeparator bindingNavigatorSeparator2;

	private SplitContainer splitContainer;

	private DataGridView pLUDataGridView;

	private TabControl tabControl;

	private TabPage labelPage;

	private TabPage textPage;

	private TabPage timePage;

	private TabPage discountPage;

	private TabPage basicPage;

	private TextBox indexTextBox;

	private TextBox text1TextBox;

	private TextBox text2TextBox;

	private TextBox text3TextBox;

	private TextBox text4TextBox;

	private TextBox text5TextBox;

	private TextBox text6TextBox;

	private TextBox text7TextBox;

	private NumericUpDown pLUIDNumericUpDown;

	private ComboBox classIDComboBox;

	private ComboBox unitIDComboBox;

	private NumericUpDown remarkNumericUpDown;

	private BindingSource unitBindingSource;

	private BindingSource classBindingSource;

	private ClassTableAdapter classTableAdapter;

	private ComboBox labelID2ComboBox;

	private ComboBox labelID1ComboBox;

	private BindingSource labelBindingSource1;

	private LabelTableAdapter labelTableAdapter;

	private ComboBox pS_UDComboBox;

	private ComboBox pS_PTComboBox;

	private ComboBox pS_PDComboBox;

	private ComboBox pS_STComboBox;

	private ComboBox pS_SDComboBox;

	private NumericUpDown tareNumericUpDown;

	private NumericUpDown costNumericUpDown;

	private NumericUpDown priceNumericUpDown;

	private ComboBox barT2ComboBox;

	private ComboBox barT1ComboBox;

	private NumericUpDown barF2NumericUpDown;

	private NumericUpDown barF1NumericUpDown;

	private BindingSource barcodeBindingSource1;

	private BarcodeTableAdapter barcodeTableAdapter;

	private TextBox nameTextBox;

	private NumericUpDown pC_PT_HNumericUpDown;

	private NumericUpDown pC_PDNumericUpDown;

	private NumericUpDown pC_ST_HNumericUpDown;

	private NumericUpDown pC_SDNumericUpDown;

	private BindingSource pLUPSTimeBindingSource1;

	private UIDataSet uiDataSet;

	private BindingSource pLUPSDateBindingSource1;

	private BindingSource labelBindingSource2;

	private BindingSource pLUPSDateBindingSource2;

	private BindingSource pLUPSDateBindingSource3;

	private BindingSource pLUPSTimeBindingSource2;

	private BindingSource barcodeBindingSource2;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripTextBox bindingNavigatorID;

	private ToolStripButton bindingNavigatorGoto;

	private ToolStripButton bindingNavigatorFilter;

	private NumericUpDown pC_UDNumericUpDown;

	private ComboBox dF_UComboBox;

	private ComboBox dF_DComboBox;

	private NumericUpDown dF_UNNumericUpDown;

	private NumericUpDown dF_DNNumericUpDown;

	private ComboBox AD1_Sort_ComboBox;

	private CheckBox AD1_Day0_CheckBox;

	private CheckBox AD1_Day1_CheckBox;

	private CheckBox AD1_Day2_CheckBox;

	private CheckBox AD1_Day3_CheckBox;

	private CheckBox AD1_Day4_CheckBox;

	private CheckBox AD1_Day5_CheckBox;

	private CheckBox AD1_Day6_CheckBox;

	private NumericUpDown AD1_VF_High_NumericUpDown;

	private NumericUpDown AD1_VF_Low_NumericUpDown;

	private NumericUpDown AD1_Data_NumericUpDown;

	private BindingSource pLUDASortBindingSource1;

	private BindingSource pLUDFUBindingSource;

	private BindingSource pLUDFDBindingSource;

	private TextBox taxTextBox;

	private ComboBox taxTypeComboBox;

	private BindingSource pLU_TaxTypeBindingSource;

	private NumericUpDown sspValue4NumericUpDown;

	private NumericUpDown sspValue3NumericUpDown;

	private NumericUpDown sspValue2NumericUpDown;

	private NumericUpDown sspValue1NumericUpDown;

	private ComboBox sspComboBox1;

	private ComboBox sspComboBox3;

	private ComboBox sspComboBox2;

	private ComboBox sspComboBox4;

	private BindingSource ssp1BindingSource;

	private Custom1TableAdapter custom1TableAdapter;

	private BindingSource ssp2BindingSource;

	private Custom2TableAdapter custom2TableAdapter;

	private BindingSource ssp3BindingSource;

	private Custom3TableAdapter custom3TableAdapter;

	private BindingSource ssp4BindingSource;

	private Custom4TableAdapter custom4TableAdapter;

	private Label sspValue4Label;

	private Label sspValue3Label;

	private Label sspValue2Label;

	private Label sspValue1Label;

	private CheckBox valid_checkBox;

	private ToolStripButton validToolStripButton;

	private ToolStripButton P0_Ethernet_toolStripButton;

	private ToolStripButton P0_TMSFile_toolStripButton;

	private TableLayoutPanel tableLayoutPanel1;

	private Panel AD1_Sort_Panel;

	private Panel AD1_Data_Panel;

	private Panel InfoPanel;

	private RadioButton AD1_Data_1_RadioButton;

	private RadioButton AD1_Data_0_RadioButton;

	private Panel AD4_Data_Panel;

	private RadioButton AD4_Data_1_RadioButton;

	private RadioButton AD4_Data_0_RadioButton;

	private CheckBox AD4_Day0_CheckBox;

	private CheckBox AD4_Day6_CheckBox;

	private CheckBox AD4_Day5_CheckBox;

	private CheckBox AD4_Day4_CheckBox;

	private NumericUpDown AD4_VF_High_NumericUpDown;

	private CheckBox AD4_Day3_CheckBox;

	private NumericUpDown AD4_VF_Low_NumericUpDown;

	private CheckBox AD4_Day2_CheckBox;

	private CheckBox AD4_Day1_CheckBox;

	private NumericUpDown AD4_Data_NumericUpDown;

	private Panel AD4_Sort_Panel;

	private ComboBox AD4_Sort_ComboBox;

	private Panel AD3_Data_Panel;

	private RadioButton AD3_Data_1_RadioButton;

	private RadioButton AD3_Data_0_RadioButton;

	private CheckBox AD3_Day0_CheckBox;

	private CheckBox AD3_Day6_CheckBox;

	private CheckBox AD3_Day5_CheckBox;

	private CheckBox AD3_Day4_CheckBox;

	private NumericUpDown AD3_VF_High_NumericUpDown;

	private CheckBox AD3_Day3_CheckBox;

	private NumericUpDown AD3_VF_Low_NumericUpDown;

	private CheckBox AD3_Day2_CheckBox;

	private CheckBox AD3_Day1_CheckBox;

	private NumericUpDown AD3_Data_NumericUpDown;

	private Panel AD3_Sort_Panel;

	private ComboBox AD3_Sort_ComboBox;

	private Panel AD2_Data_Panel;

	private RadioButton AD2_Data_1_RadioButton;

	private RadioButton AD2_Data_0_RadioButton;

	private CheckBox AD2_Day0_CheckBox;

	private CheckBox AD2_Day6_CheckBox;

	private CheckBox AD2_Day5_CheckBox;

	private CheckBox AD2_Day4_CheckBox;

	private NumericUpDown AD2_VF_High_NumericUpDown;

	private CheckBox AD2_Day3_CheckBox;

	private NumericUpDown AD2_VF_Low_NumericUpDown;

	private CheckBox AD2_Day2_CheckBox;

	private CheckBox AD2_Day1_CheckBox;

	private NumericUpDown AD2_Data_NumericUpDown;

	private Panel AD2_Sort_Panel;

	private ComboBox AD2_Sort_ComboBox;

	private BindingSource pLUDASortBindingSource4;

	private BindingSource pLUDASortBindingSource3;

	private BindingSource pLUDASortBindingSource2;

	private Label AD1_EnableDays_Label;

	private Label AD4_Mark0_Label;

	private Label AD4_EnableDays_Label;

	private Label AD4_ValueField_Label;

	private Label AD4_DiscountTo_Label;

	private Label AD4_Sort_Label;

	private Label AD3_Mark0_Label;

	private Label AD3_EnableDays_Label;

	private Label AD3_ValueField_Label;

	private Label AD3_DiscountTo_Label;

	private Label AD3_Sort_Label;

	private Label AD2_Sort_Label;

	private Label AD1_Sort_Label;

	private Label AD1_Mark0_Label;

	private Label AD1_ValueField_Label;

	private Label AD1_DiscountTo_Label;

	private Label AD2_Mark0_Label;

	private Label AD2_EnableDays_Label;

	private Label AD2_ValueField_Label;

	private Label AD2_DiscountTo_Label;

	private Label InfoLabel_Transaction_1;

	private Label InfoLabel_Transaction_0;

	private Label InfoLabel_Transaction;

	private Label InfoLabel_DiscountTo;

	private Label InfoLabel_Day6;

	private Label InfoLabel_Day5;

	private Label InfoLabel_Day4;

	private Label InfoLabel_Day3;

	private Label InfoLabel_Day2;

	private Label InfoLabel_Day1;

	private Label InfoLabel_Day0;

	private Label InfoLabel_EnableDays;

	private Label InfoLabel_ValueField;

	private Label AD4_L1_Label;

	private Label AD4_L0_Label;

	private Label AD3_L1_Label;

	private Label AD3_L0_Label;

	private Label AD1_L1_Label;

	private Label AD1_L0_Label;

	private Label InfoLabel_Value_3;

	private Label InfoLabel_Value_2;

	private Label InfoLabel_Value_1;

	private Label AD2_L1_Label;

	private Label AD2_L0_Label;

	private ComboBox SType_ComboBox;

	private Label SType_Label;

	private NumericUpDown AD4_Day_NumericUpDown;

	private NumericUpDown AD3_Day_NumericUpDown;

	private NumericUpDown AD1_Day_NumericUpDown;

	private NumericUpDown AD2_Day_NumericUpDown;

	private NotifyIcon notifyIcon1;

	private Label TE_label;

	private Label text1Label;

	private Label taxTypeLabel;

	private Label taxLabel;

	private Label imEx_Label;

	private Label nameLabel;

	private Label tareLabel1;

	private Label costLabel1;

	private Label priceLabel1;

	private Label classIDLabel;

	private Label unitIDLabel;

	private Label remarkLabel;

	private Label pLUIDLabel;

	private Label indexLabel;

	private Label barT2Label1;

	private Label barT1Label1;

	private Label barF2Label1;

	private Label barF1Label1;

	private Label labelID2Label;

	private Label labelID1Label;

	private Label text2Label;

	private Label text3Label;

	private Label text4Label;

	private Label text5Label;

	private Label text6Label;

	private Label text7Label;

	private Label pC_UDLabel;

	private Label pC_PTLabel;

	private Label pC_PDLabel;

	private Label pC_STLabel;

	private Label pC_SDLabel;

	private Label pS_UDLabel;

	private Label pS_PTLabel;

	private Label pS_PDLabel;

	private Label pS_STLabel;

	private Label pS_SDLabel;

	private Label label1;

	private Label dF_ULabel;

	private Label dF_DLabel;

	private Timer timer_savetick;

	private ToolStripButton cloneToolStripButton;

	private ToolStripButton FilterAdd_ToolStripButton;

	private ToolStripDropDownButton gotoType_ToolStripDropDownButton;

	private ToolStripMenuItem numberToolStripMenuItem;

	private ToolStripMenuItem itemCodeToolStripMenuItem;

	private ToolStripMenuItem indexToolStripMenuItem;

	private Label bitmapLabel;

	private NumericUpDown FlagValue_NumericUpDown;

	private NumericUpDown Flag_NumericUpDown;

	private TextBox Alpha_TextBox;

	private Label alpha_label;

	private TableLayoutPanel Basic_TableLayoutPanel;

	private Panel Basic_Fix1_Panel;

	private Panel Basic_Fix3_Panel;

	private Panel Basic_Measure_Panel;

	private TextBox Measure_Pos_TextBox;

	private Panel Basic_Tare_Panel;

	private Panel Basic_TarePencent_Panel;

	private CheckBox Measure_CheckBox;

	private NumericUpDown TarePencent_Pos_NumericUpDown;

	private CheckBox TarePencent_CheckBox;

	private Panel Basic_FixedWeight_Panel;

	private NumericUpDown FixedWeight_Pos_NumericUpDown;

	private CheckBox FixedWeight_CheckBox;

	private NumericUpDown Tare_Pos_NumericUpDown;

	private TextBox text7_Pos_TextBox;

	private Panel Basic_ItemCode_Panel;

	private Panel Basic_ALPHA_Panel;

	private Panel Basic_TaxRate_Panel;

	private Panel Basic_SSP1_Panel;

	private Panel Basic_SType_Panel;

	private Label Debug_Label;

	private TableLayoutPanel Print_TableLayoutPanel;

	private Panel Print_Bill1_Panel;

	private Panel Print_Bill2_Panel;

	private Panel Print_Bitmap_Panel;

	private Panel Basic_TaxType_Panel;

	private Panel Basic_SSP4_Panel;

	private Panel Basic_SSP3_Panel;

	private Panel Basic_SSP2_Panel;

	private TableLayoutPanel Text_TableLayoutPanel;

	private Panel Text_1_Panel;

	private Panel Text_2_Panel;

	private Panel Text_3_Panel;

	private Panel Text_4_Panel;

	private Panel Text_5_Panel;

	private Panel Text_6_Panel;

	private Panel Text_7_Panel;

	private Label TE2_label;

	private Label TarePencent_Pos_Label;

	private ComboBox Bitmap_ComboBox;

	private BindingSource bitmapBindingSource;

	private Panel Basic_Unit_Panel;

	private Panel Basic_Class_Panel;

	private Panel Basic_Index_Panel;

	private TableLayoutPanel tableLayoutPanel2;

	private Panel Time_TimeSD_1_Panel;

	private Panel Time_TimeST_1_Panel;

	private Panel Time_TimePD_1_Panel;

	private Panel Time_TimePT_1_Panel;

	private Panel Time_TimeUD_1_Panel;

	private Panel Time_TimeSD_2_Panel;

	private Panel Time_TimeST_2_Panel;

	private Panel Time_TimePD_2_Panel;

	private Panel Time_TimePT_2_Panel;

	private Panel Time_TimeUD_2_Panel;

	private ToolStripMenuItem nameToolStripMenuItem;

	private BindingSource bitmapBindingSource2;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private DataGridViewCheckBoxColumn Valid;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn36;

	private DataGridViewTextBoxColumn priceTextBoxColumn;

	private DataGridViewTextBoxColumn costTextBoxColumn;

	private DataGridViewTextBoxColumn tareTextBoxColumn;

	private DataGridViewComboBoxColumn dataGridViewTextBoxColumn4;

	private DataGridViewComboBoxColumn ClassID;

	private DataGridViewTextBoxColumn Remark;

	private DataGridViewTextBoxColumn Index;

	private DataGridViewComboBoxColumn TaxTypeColumn;

	private DataGridViewTextBoxColumn taxTextBoxColumn;

	private DataGridViewTextBoxColumn sspValue1Column;

	private DataGridViewTextBoxColumn sspValue2Column;

	private DataGridViewTextBoxColumn sspValue3Column;

	private DataGridViewTextBoxColumn sspValue4Column;

	private DataGridViewComboBoxColumn LabelID1;

	private DataGridViewComboBoxColumn BarT1;

	private DataGridViewTextBoxColumn BarF1;

	private DataGridViewComboBoxColumn LabelID2;

	private DataGridViewComboBoxColumn BarT2;

	private DataGridViewTextBoxColumn BarF2;

	private DataGridViewComboBoxColumn Bitmap;

	private DataGridViewTextBoxColumn Text1;

	private DataGridViewTextBoxColumn Text2;

	private DataGridViewTextBoxColumn Text3;

	private DataGridViewTextBoxColumn Text4;

	private DataGridViewTextBoxColumn Text5;

	private DataGridViewTextBoxColumn Text6;

	private DataGridViewTextBoxColumn Text7;

	private Panel Basic_SaveAsWeight_Panel;

	private CheckBox SaveAsWeight_CheckBox;

	public PluForm()
	{
		InitializeComponent();
	}

	private void FindCustom()
	{
		string fileName = Application.StartupPath + "\\Custom.xml";
		uiDataSet.Custom.ReadXml(fileName);
		Panel[] array = new Panel[4] { Basic_SSP1_Panel, Basic_SSP2_Panel, Basic_SSP3_Panel, Basic_SSP4_Panel };
		ComboBox[] array2 = new ComboBox[4] { sspComboBox1, sspComboBox2, sspComboBox3, sspComboBox4 };
		BindingSource[] array3 = new BindingSource[4] { ssp1BindingSource, ssp2BindingSource, ssp3BindingSource, ssp4BindingSource };
		NumericUpDown[] array4 = new NumericUpDown[4] { sspValue1NumericUpDown, sspValue2NumericUpDown, sspValue3NumericUpDown, sspValue4NumericUpDown };
		Label[] array5 = new Label[4] { sspValue1Label, sspValue2Label, sspValue3Label, sspValue4Label };
		DataGridViewTextBoxColumn[] array6 = new DataGridViewTextBoxColumn[4] { sspValue1Column, sspValue2Column, sspValue3Column, sspValue4Column };
		for (int i = 0; i < 4; i++)
		{
			DataRow[] array7 = uiDataSet.Custom.Select($"[Ssp] = {i + 1}");
			if (array7.Length > 0)
			{
				UIDataSet.CustomRow customRow = array7[0] as UIDataSet.CustomRow;
				array3[i].DataMember = customRow._Table;
				array2[i].ValueMember = "ID";
				array2[i].DisplayMember = "Text1";
				array2[i].DataSource = array3[i];
				array2[i].Bounds = array4[i].Bounds;
				array2[i].Visible = true;
				array2[i].DataBindings.Add("SelectedValue", pLUBindingSource, $"SspValue{i + 1}", formattingEnabled: true, DataSourceUpdateMode.OnPropertyChanged);
				array4[i].Visible = false;
				array5[i].Text = customRow.Display + ":";
				array6[i].HeaderText = customRow.Display;
				array[i].Visible = true;
			}
			else
			{
				array2[i].Visible = false;
				array4[i].Visible = true;
				array6[i].Visible = Settings.Default.Enable_PLU_UselessSSP;
				array[i].Visible = Settings.Default.Enable_PLU_UselessSSP;
			}
		}
	}

	private void sspComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["ID"], dataRowView["Text1"]);
		}
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
			return;
		}
		NoCTRowChanged = true;
		ECSDataSet.PLURow currentRow = GetCurrentRow();
		DataRow dataRow = null;
		object[] array = null;
		if (currentRow != null)
		{
			try
			{
				dataRow = eCSDataSet.PLU.Rows.Find(currentRow.PLUID);
				array = dataRow.ItemArray;
			}
			catch (Exception)
			{
			}
		}
		switch (Type)
		{
		case "PLU":
			eCSDataSet.PLU.Clear();
			pLUTableAdapter.Fill(eCSDataSet.PLU);
			pLUBindingSource.ResetBindings(metadataChanged: false);
			break;
		case "Class":
			eCSDataSet.Class.Clear();
			classTableAdapter.Fill(eCSDataSet.Class);
			classBindingSource.ResetBindings(metadataChanged: false);
			break;
		case "Barcode":
			eCSDataSet.Barcode.Clear();
			barcodeTableAdapter.Fill(eCSDataSet.Barcode);
			barcodeBindingSource1.ResetBindings(metadataChanged: false);
			barcodeBindingSource2.ResetBindings(metadataChanged: false);
			break;
		case "Label":
			eCSDataSet.Label.Clear();
			labelTableAdapter.Fill(eCSDataSet.Label);
			labelBindingSource1.ResetBindings(metadataChanged: false);
			labelBindingSource2.ResetBindings(metadataChanged: false);
			break;
		case "Custom1":
			eCSDataSet.Custom1.Clear();
			custom1TableAdapter.Fill(eCSDataSet.Custom1);
			break;
		case "Custom2":
			eCSDataSet.Custom2.Clear();
			custom2TableAdapter.Fill(eCSDataSet.Custom2);
			break;
		case "Custom3":
			eCSDataSet.Custom3.Clear();
			custom3TableAdapter.Fill(eCSDataSet.Custom3);
			break;
		case "Custom4":
			eCSDataSet.Custom4.Clear();
			custom4TableAdapter.Fill(eCSDataSet.Custom4);
			break;
		case "Bitmap":
			BitmapFuc.DataSet_Bitmap_Load_Sim(ref eCSDataSet);
			break;
		}
		if (dataRow != null && array != null && dataRow.RowState != DataRowState.Detached)
		{
			dataRow.ItemArray = array;
		}
		NoCTRowChanged = false;
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "PLUForm");
	}

	private void LangSocket_Ramuza()
	{
		Basic_TableLayoutPanel.RowStyles.Insert(1, new RowStyle(SizeType.AutoSize));
		Panel panel = new Panel();
		panel.Name = "LangSocket_Lot_Panel";
		panel.Size = Basic_ALPHA_Panel.Size;
		Basic_TableLayoutPanel.Controls.Add(panel, 0, 1);
		Label label = new Label();
		label.Name = "LangSocket_Lot_Label";
		label.Text = "Lot";
		label.Bounds = remarkLabel.Bounds;
		panel.Controls.Add(label);
		text6TextBox.Parent = panel;
		text6TextBox.Multiline = false;
		text6TextBox.MaxLength = 12;
		text6TextBox.Bounds = remarkNumericUpDown.Bounds;
		Text_6_Panel.Visible = false;
		Text6.HeaderText = "Lot";
		Text6.DisplayIndex = 3;
		AD4_Data_NumericUpDown.Bounds = costNumericUpDown.Bounds;
		AD4_Data_NumericUpDown.Parent = costNumericUpDown.Parent;
		costNumericUpDown.Visible = false;
		costLabel1.Text = "Desconto";
	}

	private void PluForm_Load(object sender, EventArgs e)
	{
		_ = ConfigurationManager.OpenExeConfiguration(ConfigurationUserLevel.PerUserRoamingAndLocal).FilePath;
		Text = Program.GetLang("pw_PLU");
		cloneToolStripButton.Text = Program.GetLang("pw_Clone");
		AD1_Sort_Label.Text = Program.GetLang("pw_AutoDiscount1");
		AD2_Sort_Label.Text = Program.GetLang("pw_AutoDiscount2");
		AD3_Sort_Label.Text = Program.GetLang("pw_AutoDiscount3");
		AD4_Sort_Label.Text = Program.GetLang("pw_AutoDiscount4");
		basicPage.Text = Program.GetLang("pw_BasicInfo");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorFilter.Text = Program.GetLang("pw_Filter");
		FilterAdd_ToolStripButton.Text = Program.GetLang("pw_Filter") + "+";
		bindingNavigatorGoto.Text = Program.GetLang("pw_Switchto");
		gotoType_ToolStripDropDownButton.Text = Program.GetLang("pw_Switchto");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		ClassID.HeaderText = Program.GetLang("pw_AffiliatedClass");
		classIDLabel.Text = Program.GetLang("pw_AffiliatedClass") + ":";
		costLabel1.Text = Program.GetLang("pw_Cost") + ":";
		costTextBoxColumn.HeaderText = Program.GetLang("pw_Cost");
		dataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Number");
		dataGridViewTextBoxColumn36.HeaderText = Program.GetLang("pw_Name");
		dataGridViewTextBoxColumn4.HeaderText = Program.GetLang("pw_Unit");
		dF_DLabel.Text = Program.GetLang("pw_LowerLimit_sl_");
		dF_ULabel.Text = Program.GetLang("pw_UpperLimit_sl_");
		discountPage.Text = Program.GetLang("pw_DiscountInfo");
		Index.HeaderText = Program.GetLang("pw_IndexBarcode");
		indexLabel.Text = Program.GetLang("pw_IndexBarcode") + ":";
		InfoLabel_Day0.Text = Program.GetLang("pw_Sun");
		InfoLabel_Day1.Text = Program.GetLang("pw_Mon");
		InfoLabel_Day2.Text = Program.GetLang("pw_Tues");
		InfoLabel_Day3.Text = Program.GetLang("pw_Wed");
		InfoLabel_Day4.Text = Program.GetLang("pw_Thurs");
		InfoLabel_Day5.Text = Program.GetLang("pw_Fri");
		InfoLabel_Day6.Text = Program.GetLang("pw_Sat");
		InfoLabel_DiscountTo.Text = Program.GetLang("pw_DiscountUPrice_sl_");
		InfoLabel_EnableDays.Text = Program.GetLang("pw_ActiveDay_sl_");
		InfoLabel_Transaction.Text = Program.GetLang("pw_Transaction_sl_");
		InfoLabel_Transaction_0.Text = Program.GetLang("pw_ForbiddenInside");
		InfoLabel_Transaction_1.Text = Program.GetLang("pw_ForbiddenOutside");
		InfoLabel_Value_1.Text = Program.GetLang("pw_Amount");
		InfoLabel_Value_2.Text = Program.GetLang("pw_HHMM");
		InfoLabel_Value_3.Text = Program.GetLang("pw_Price");
		InfoLabel_ValueField.Text = Program.GetLang("pw_ValueField");
		label1.Text = Program.GetLang("pw_ManualDiscount") + ":";
		imEx_Label.Text = Program.GetLang("pw_Import_Export") + ":";
		labelPage.Text = Program.GetLang("pw_PrintInfo");
		nameLabel.Text = Program.GetLang("pw_Name") + ":";
		P0_Ethernet_toolStripButton.Text = Program.GetLang("pw_Ethernet");
		P0_TMSFile_toolStripButton.Text = Program.GetLang("pw_TMSFile");
		pC_PDLabel.Text = Program.GetLang("pw_PackageDays") + ":";
		pC_PTLabel.Text = Program.GetLang("pw_PackageTime") + ":";
		pC_SDLabel.Text = Program.GetLang("pw_SaleDays") + ":";
		pC_STLabel.Text = Program.GetLang("pw_SaleTime") + ":";
		pC_UDLabel.Text = Program.GetLang("pw_ShelfDays") + ":";
		pLUIDLabel.Text = Program.GetLang("pw_Number") + ":";
		priceLabel1.Text = Program.GetLang("pw_UPrice") + ":";
		priceTextBoxColumn.HeaderText = Program.GetLang("pw_UPrice");
		pS_PDLabel.Text = Program.GetLang("pw_PrintPackageDate") + ":";
		pS_PTLabel.Text = Program.GetLang("pw_PrintPackageTime") + ":";
		pS_SDLabel.Text = Program.GetLang("pw_PrintSaleDate") + ":";
		pS_STLabel.Text = Program.GetLang("pw_PrintSaleTime") + ":";
		pS_UDLabel.Text = Program.GetLang("pw_PrintShelfDate") + ":";
		Remark.HeaderText = Program.GetLang("pw_ItemCode");
		remarkLabel.Text = Program.GetLang("pw_ItemCode") + ":";
		sspValue1Column.HeaderText = Program.GetLang("pw_SSPValue1");
		sspValue1Label.Text = Program.GetLang("pw_SSPValue1") + ":";
		sspValue2Column.HeaderText = Program.GetLang("pw_SSPValue2");
		sspValue2Label.Text = Program.GetLang("pw_SSPValue2") + ":";
		sspValue3Column.HeaderText = Program.GetLang("pw_SSPValue3");
		sspValue3Label.Text = Program.GetLang("pw_SSPValue3") + ":";
		sspValue4Column.HeaderText = Program.GetLang("pw_SSPValue4");
		sspValue4Label.Text = Program.GetLang("pw_SSPValue4") + ":";
		SType_Label.Text = Program.GetLang("pw_SpecialMode");
		tareLabel1.Text = Program.GetLang("pw_Tare") + ":";
		tareTextBoxColumn.HeaderText = Program.GetLang("pw_Tare");
		taxLabel.Text = Program.GetLang("pw_TaxRate") + ":";
		taxTextBoxColumn.HeaderText = Program.GetLang("pw_TaxRate");
		TaxTypeColumn.HeaderText = Program.GetLang("pw_TaxType");
		taxTypeLabel.Text = Program.GetLang("pw_TaxType") + ":";
		Text1.HeaderText = Program.GetLang("pw_Text1");
		text1Label.Text = Program.GetLang("pw_Text1") + ":";
		Text2.HeaderText = Program.GetLang("pw_Text2");
		text2Label.Text = Program.GetLang("pw_Text2") + ":";
		Text3.HeaderText = Program.GetLang("pw_Text3");
		text3Label.Text = Program.GetLang("pw_Text3") + ":";
		Text4.HeaderText = Program.GetLang("pw_Text4");
		text4Label.Text = Program.GetLang("pw_Text4") + ":";
		Text5.HeaderText = Program.GetLang("pw_Text5");
		text5Label.Text = Program.GetLang("pw_Text5") + ":";
		Text6.HeaderText = Program.GetLang("pw_Text6");
		text6Label.Text = Program.GetLang("pw_Text6") + ":";
		Text7.HeaderText = Program.GetLang("pw_Text7");
		text7Label.Text = Program.GetLang("pw_Text7") + ":";
		textPage.Text = Program.GetLang("pw_TextInfo");
		timePage.Text = Program.GetLang("pw_TimeInfo");
		unitIDLabel.Text = Program.GetLang("pw_Unit") + ":";
		Valid.HeaderText = Program.GetLang("pw_Import_Export");
		validToolStripButton.Text = Program.GetLang("pw_Import_ExportAll");
		numberToolStripMenuItem.Text = Program.GetLang("pw_Number");
		itemCodeToolStripMenuItem.Text = Program.GetLang("pw_ItemCode");
		indexToolStripMenuItem.Text = Program.GetLang("pw_IndexBarcode");
		nameToolStripMenuItem.Text = Program.GetLang("pw_Name");
		alpha_label.Text = Program.GetLang("pw_AlphaSearch");
		Measure_CheckBox.Text = Program.GetLang("pw_MeasureWord");
		SaveAsWeight_CheckBox.Text = Program.GetLang("pw_SaveAsWeight");
		TarePencent_CheckBox.Text = Program.GetLang("pw_PercentTare");
		FixedWeight_CheckBox.Text = Program.GetLang("pw_FixedWeight");
		DataGridViewComboBoxColumn bitmap = Bitmap;
		string headerText = (bitmapLabel.Text = Program.GetLang("pw_Bitmap"));
		bitmap.HeaderText = headerText;
		Basic_ALPHA_Panel.Visible = Settings.Default.Enable_PLU_AlphaSearch;
		Basic_TaxType_Panel.Visible = Settings.Default.Enable_PLU_Tax;
		Basic_SType_Panel.Visible = Settings.Default.Enable_PLU_SpecialMode;
		Basic_ItemCode_Panel.Visible = Settings.Default.Enable_PLU_ItemCode;
		Basic_Index_Panel.Visible = Settings.Default.Enable_PLU_Index;
		Basic_Class_Panel.Visible = Settings.Default.Enable_PLU_Class;
		Print_Bitmap_Panel.Visible = Settings.Default.Enable_PLU_Bitmap;
		Panel time_TimePD_1_Panel = Time_TimePD_1_Panel;
		bool visible = (Time_TimePD_2_Panel.Visible = Settings.Default.Enable_PLU_TimePD);
		time_TimePD_1_Panel.Visible = visible;
		Panel time_TimePT_1_Panel = Time_TimePT_1_Panel;
		bool visible2 = (Time_TimePT_2_Panel.Visible = Settings.Default.Enable_PLU_TimePT);
		time_TimePT_1_Panel.Visible = visible2;
		Panel time_TimeSD_1_Panel = Time_TimeSD_1_Panel;
		bool visible3 = (Time_TimeSD_2_Panel.Visible = Settings.Default.Enable_PLU_TimeSD);
		time_TimeSD_1_Panel.Visible = visible3;
		Panel time_TimeST_1_Panel = Time_TimeST_1_Panel;
		bool visible4 = (Time_TimeST_2_Panel.Visible = Settings.Default.Enable_PLU_TimeST);
		time_TimeST_1_Panel.Visible = visible4;
		Panel time_TimeUD_1_Panel = Time_TimeUD_1_Panel;
		bool visible5 = (Time_TimeUD_2_Panel.Visible = Settings.Default.Enable_PLU_TimeUD);
		time_TimeUD_1_Panel.Visible = visible5;
		if (!Settings.Default.Enable_PLU_TimePD && !Settings.Default.Enable_PLU_TimePT && !Settings.Default.Enable_PLU_TimeSD && !Settings.Default.Enable_PLU_TimeST && !Settings.Default.Enable_PLU_TimeUD)
		{
			timePage.Parent = null;
		}
		if (!Settings.Default.Enable_PLU_Discount)
		{
			discountPage.Parent = null;
		}
		if (Settings.Default.Enable_PLU_Bill2)
		{
			Print_Bill2_Panel.Visible = true;
			LabelID1.HeaderText = Program.GetLang("pw_Bill1") + "-" + Program.GetLang("pw_PrintFormat");
			labelID1Label.Text = Program.GetLang("pw_Bill1") + "-" + Program.GetLang("pw_PrintFormat") + ":";
			LabelID2.HeaderText = Program.GetLang("pw_Bill2") + "-" + Program.GetLang("pw_PrintFormat");
			labelID2Label.Text = Program.GetLang("pw_Bill2") + "-" + Program.GetLang("pw_PrintFormat") + ":";
			BarT1.HeaderText = Program.GetLang("pw_Bill1") + "-" + Program.GetLang("pw_Barcode");
			barT1Label1.Text = Program.GetLang("pw_Bill1") + "-" + Program.GetLang("pw_Barcode") + ":";
			BarT2.HeaderText = Program.GetLang("pw_Bill2") + "-" + Program.GetLang("pw_Barcode");
			barT2Label1.Text = Program.GetLang("pw_Bill2") + "-" + Program.GetLang("pw_Barcode") + ":";
			BarF1.HeaderText = Program.GetLang("pw_Bill1") + "-" + Program.GetLang("pw_BarcodeFlag");
			barF1Label1.Text = Program.GetLang("pw_Bill1") + "-" + Program.GetLang("pw_BarcodeFlag") + ":";
			BarF2.HeaderText = Program.GetLang("pw_Bill2") + "-" + Program.GetLang("pw_BarcodeFlag");
			barF2Label1.Text = Program.GetLang("pw_Bill2") + "-" + Program.GetLang("pw_BarcodeFlag") + ":";
		}
		else
		{
			Print_Bill2_Panel.Visible = false;
			LabelID1.HeaderText = Program.GetLang("pw_PrintFormat");
			labelID1Label.Text = Program.GetLang("pw_PrintFormat") + ":";
			LabelID2.Visible = false;
			labelID2Label.Text = "";
			BarT1.HeaderText = Program.GetLang("pw_Barcode");
			barT1Label1.Text = Program.GetLang("pw_Barcode") + ":";
			BarT2.Visible = false;
			barT2Label1.Text = "";
			BarF1.HeaderText = Program.GetLang("pw_BarcodeFlag");
			barF1Label1.Text = Program.GetLang("pw_BarcodeFlag") + ":";
			BarF2.Visible = false;
			barF2Label1.Text = "";
		}
		DataGridViewCellStyle defaultCellStyle = taxTextBoxColumn.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle2 = priceTextBoxColumn.DefaultCellStyle;
		string text = (costTextBoxColumn.DefaultCellStyle.Format = "F" + Settings.Default.Format_Price);
		string format = (defaultCellStyle2.Format = text);
		defaultCellStyle.Format = format;
		tareTextBoxColumn.DefaultCellStyle.Format = "F" + Settings.Default.Format_Weight;
		Label aD1_EnableDays_Label = AD1_EnableDays_Label;
		Label aD2_EnableDays_Label = AD2_EnableDays_Label;
		Label aD3_EnableDays_Label = AD3_EnableDays_Label;
		string text4 = (AD4_EnableDays_Label.Text = InfoLabel_EnableDays.Text);
		string text6 = (aD3_EnableDays_Label.Text = text4);
		string text8 = (aD2_EnableDays_Label.Text = text6);
		aD1_EnableDays_Label.Text = text8;
		Label aD1_DiscountTo_Label = AD1_DiscountTo_Label;
		Label aD2_DiscountTo_Label = AD2_DiscountTo_Label;
		Label aD3_DiscountTo_Label = AD3_DiscountTo_Label;
		string text10 = (AD4_DiscountTo_Label.Text = InfoLabel_DiscountTo.Text);
		string text12 = (aD3_DiscountTo_Label.Text = text10);
		string text14 = (aD2_DiscountTo_Label.Text = text12);
		aD1_DiscountTo_Label.Text = text14;
		RadioButton aD1_Data_0_RadioButton = AD1_Data_0_RadioButton;
		RadioButton aD2_Data_0_RadioButton = AD2_Data_0_RadioButton;
		RadioButton aD3_Data_0_RadioButton = AD3_Data_0_RadioButton;
		string text16 = (AD4_Data_0_RadioButton.Text = InfoLabel_Transaction_0.Text);
		string text18 = (aD3_Data_0_RadioButton.Text = text16);
		string text20 = (aD2_Data_0_RadioButton.Text = text18);
		aD1_Data_0_RadioButton.Text = text20;
		RadioButton aD1_Data_1_RadioButton = AD1_Data_1_RadioButton;
		RadioButton aD2_Data_1_RadioButton = AD2_Data_1_RadioButton;
		RadioButton aD3_Data_1_RadioButton = AD3_Data_1_RadioButton;
		string text22 = (AD4_Data_1_RadioButton.Text = InfoLabel_Transaction_1.Text);
		string text24 = (aD3_Data_1_RadioButton.Text = text22);
		string text26 = (aD2_Data_1_RadioButton.Text = text24);
		aD1_Data_1_RadioButton.Text = text26;
		CheckBox aD1_Day0_CheckBox = AD1_Day0_CheckBox;
		CheckBox aD2_Day0_CheckBox = AD2_Day0_CheckBox;
		CheckBox aD3_Day0_CheckBox = AD3_Day0_CheckBox;
		string text28 = (AD4_Day0_CheckBox.Text = InfoLabel_Day0.Text);
		string text30 = (aD3_Day0_CheckBox.Text = text28);
		string text32 = (aD2_Day0_CheckBox.Text = text30);
		aD1_Day0_CheckBox.Text = text32;
		CheckBox aD1_Day1_CheckBox = AD1_Day1_CheckBox;
		CheckBox aD2_Day1_CheckBox = AD2_Day1_CheckBox;
		CheckBox aD3_Day1_CheckBox = AD3_Day1_CheckBox;
		string text34 = (AD4_Day1_CheckBox.Text = InfoLabel_Day1.Text);
		string text36 = (aD3_Day1_CheckBox.Text = text34);
		string text38 = (aD2_Day1_CheckBox.Text = text36);
		aD1_Day1_CheckBox.Text = text38;
		CheckBox aD1_Day2_CheckBox = AD1_Day2_CheckBox;
		CheckBox aD2_Day2_CheckBox = AD2_Day2_CheckBox;
		CheckBox aD3_Day2_CheckBox = AD3_Day2_CheckBox;
		string text40 = (AD4_Day2_CheckBox.Text = InfoLabel_Day2.Text);
		string text42 = (aD3_Day2_CheckBox.Text = text40);
		string text44 = (aD2_Day2_CheckBox.Text = text42);
		aD1_Day2_CheckBox.Text = text44;
		CheckBox aD1_Day3_CheckBox = AD1_Day3_CheckBox;
		CheckBox aD2_Day3_CheckBox = AD2_Day3_CheckBox;
		CheckBox aD3_Day3_CheckBox = AD3_Day3_CheckBox;
		string text46 = (AD4_Day3_CheckBox.Text = InfoLabel_Day3.Text);
		string text48 = (aD3_Day3_CheckBox.Text = text46);
		string text50 = (aD2_Day3_CheckBox.Text = text48);
		aD1_Day3_CheckBox.Text = text50;
		CheckBox aD1_Day4_CheckBox = AD1_Day4_CheckBox;
		CheckBox aD2_Day4_CheckBox = AD2_Day4_CheckBox;
		CheckBox aD3_Day4_CheckBox = AD3_Day4_CheckBox;
		string text52 = (AD4_Day4_CheckBox.Text = InfoLabel_Day4.Text);
		string text54 = (aD3_Day4_CheckBox.Text = text52);
		string text56 = (aD2_Day4_CheckBox.Text = text54);
		aD1_Day4_CheckBox.Text = text56;
		CheckBox aD1_Day5_CheckBox = AD1_Day5_CheckBox;
		CheckBox aD2_Day5_CheckBox = AD2_Day5_CheckBox;
		CheckBox aD3_Day5_CheckBox = AD3_Day5_CheckBox;
		string text58 = (AD4_Day5_CheckBox.Text = InfoLabel_Day5.Text);
		string text60 = (aD3_Day5_CheckBox.Text = text58);
		string text62 = (aD2_Day5_CheckBox.Text = text60);
		aD1_Day5_CheckBox.Text = text62;
		CheckBox aD1_Day6_CheckBox = AD1_Day6_CheckBox;
		CheckBox aD2_Day6_CheckBox = AD2_Day6_CheckBox;
		CheckBox aD3_Day6_CheckBox = AD3_Day6_CheckBox;
		string text64 = (AD4_Day6_CheckBox.Text = InfoLabel_Day6.Text);
		string text66 = (aD3_Day6_CheckBox.Text = text64);
		string text68 = (aD2_Day6_CheckBox.Text = text66);
		aD1_Day6_CheckBox.Text = text68;
		Label aD1_ValueField_Label = AD1_ValueField_Label;
		Label aD2_ValueField_Label = AD2_ValueField_Label;
		Label aD3_ValueField_Label = AD3_ValueField_Label;
		string text70 = (AD4_ValueField_Label.Text = InfoLabel_ValueField.Text + ":");
		string text72 = (aD3_ValueField_Label.Text = text70);
		string text74 = (aD2_ValueField_Label.Text = text72);
		aD1_ValueField_Label.Text = text74;
		FilterAdd_ToolStripButton.Visible = false;
		Font = Settings.Default.CustomFont;
		Program.LabelRight_SetXLocaltion(new Control[22]
		{
			pLUIDLabel, imEx_Label, nameLabel, alpha_label, remarkLabel, indexLabel, classIDLabel, unitIDLabel, Measure_CheckBox, SaveAsWeight_CheckBox,
			tareLabel1, TarePencent_CheckBox, FixedWeight_CheckBox, priceLabel1, costLabel1, taxTypeLabel, taxLabel, sspValue1Label, sspValue2Label, sspValue3Label,
			sspValue4Label, SType_Label
		}, new Control[22]
		{
			pLUIDNumericUpDown, valid_checkBox, nameTextBox, Alpha_TextBox, remarkNumericUpDown, indexTextBox, classIDComboBox, unitIDComboBox, Measure_Pos_TextBox, Tare_Pos_NumericUpDown,
			TarePencent_Pos_NumericUpDown, TarePencent_Pos_Label, FixedWeight_Pos_NumericUpDown, priceNumericUpDown, costNumericUpDown, taxTypeComboBox, taxTextBox, sspValue1NumericUpDown, sspValue2NumericUpDown, sspValue3NumericUpDown,
			sspValue4NumericUpDown, SType_ComboBox
		});
		Program.LabelRight_SetXLocaltion(new Label[7] { labelID1Label, barT1Label1, barF1Label1, labelID2Label, barT2Label1, barF2Label1, bitmapLabel }, new Control[7] { labelID1ComboBox, barT1ComboBox, barF1NumericUpDown, labelID2ComboBox, barT2ComboBox, barF2NumericUpDown, Bitmap_ComboBox });
		Program.LabelRight_SetXLocaltion(new Label[7] { text1Label, text2Label, text3Label, text4Label, text5Label, text6Label, text7Label }, new Control[8] { text1TextBox, text2TextBox, text3TextBox, text4TextBox, text5TextBox, text6TextBox, text7TextBox, text7_Pos_TextBox });
		Program.LabelRight_SetXLocaltion(new Label[10] { pS_SDLabel, pS_STLabel, pS_PDLabel, pS_PTLabel, pS_UDLabel, pC_SDLabel, pC_STLabel, pC_PDLabel, pC_PTLabel, pC_UDLabel }, new Control[10] { pS_SDComboBox, pS_STComboBox, pS_PDComboBox, pS_PTComboBox, pS_UDComboBox, pC_SDNumericUpDown, pC_ST_HNumericUpDown, pC_PDNumericUpDown, pC_PT_HNumericUpDown, pC_UDNumericUpDown });
		pLUBindingSource.Filter = "PLUID >= " + Settings.Default.minUserPLUID + "AND PLUID <=" + Settings.Default.maxUserPLUID;
		classBindingSource.Filter = "ClassID >= " + (Settings.Default.minClassID - 1);
		string fileName = Application.StartupPath + "\\Combo.xml";
		uiDataSet.ReadXml(fileName);
		string[] array = uiDataSet.SimCombo.FindByName("PLU SType").ValueDisplay.Split('|');
		SimComboVD_No[] array2 = new SimComboVD_No[array.Length / 2];
		for (int i = 0; i < array.Length / 2; i++)
		{
			SimComboVD_No simComboVD_No = new SimComboVD_No();
			simComboVD_No.Value = int.Parse(array[i * 2]);
			simComboVD_No.Display = array[i * 2 + 1];
			array2[i] = simComboVD_No;
		}
		SType_ComboBox.ValueMember = "Value";
		SType_ComboBox.DisplayMember = "Display";
		SType_ComboBox.DataSource = array2;
		RDS.DataSet_Init_Unit(ref eCSDataSet);
		DataSet_Refresh("Barcode");
		DataSet_Refresh("Label");
		DataSet_Refresh("Class");
		DataSet_Refresh("Custom1");
		DataSet_Refresh("Custom2");
		DataSet_Refresh("Custom3");
		DataSet_Refresh("Custom4");
		DataSet_Refresh("Bitmap");
		pLUTableAdapter.Fill(eCSDataSet.PLU);
		dF_UNNumericUpDown.Enabled = dF_UComboBox.SelectedIndex == 3;
		dF_DNNumericUpDown.Enabled = dF_DComboBox.SelectedIndex == 3;
		eCSDataSet.PLU.PLURowChanged += PLU_PLURowChanged;
		ADx_Sort_ComboBox_SelectedIndexChanged();
		timer_savetick.Enabled = true;
		FindCustom();
		if (Program.LangSocket.Contains("Ramuza"))
		{
			LangSocket_Ramuza();
		}
	}

	private void PLU_PLURowChanged(object sender, ECSDataSet.PLURowChangeEvent e)
	{
		if (NoCTRowChanged || e.Action == DataRowAction.Rollback || e.Action == DataRowAction.Commit)
		{
			return;
		}
		if ((decimal)e.Row.PLUID > Settings.Default.maxPLUID)
		{
			e.Row.RejectChanges();
			return;
		}
		if ((decimal)e.Row.PLUID > Settings.Default.maxUserPLUID && Program.right == Program.Right.User)
		{
			e.Row.RejectChanges();
			return;
		}
		if (e.Row.PLUID < Settings.Default.minUserPLUID && Program.right == Program.Right.User)
		{
			e.Row.RejectChanges();
			return;
		}
		if (!PLUvalidChanged)
		{
			eCSDataSet.PLU.PLURowChanged -= PLU_PLURowChanged;
			e.Row.Valid = true;
			eCSDataSet.PLU.PLURowChanged += PLU_PLURowChanged;
		}
		else
		{
			PLUvalidChanged = false;
		}
		try
		{
			pLUTableAdapter.Update(eCSDataSet.PLU);
			DataSet_Changed = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	public void SaveData()
	{
		Validate();
		try
		{
			pLUBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			pLUBindingSource.CancelEdit();
		}
		if (eCSDataSet.HasChanges())
		{
			try
			{
				pLUTableAdapter.Update(eCSDataSet.PLU);
				DataSet_Changed = true;
			}
			catch (Exception ex2)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void PluForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		eCSDataSet.PLU.PLURowChanged -= PLU_PLURowChanged;
		Select(directed: true, forward: true);
		SaveData();
	}

	private void pLUComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["Value"], dataRowView["Display"]);
		}
	}

	private void classIDComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["ClassID"], dataRowView["Name"]);
		}
	}

	private void unitIDComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["UnitID"], dataRowView["Name"]);
		}
	}

	private void barcodeComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["BarID"], dataRowView["Name"]);
		}
	}

	private void labelComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["LabelID"], dataRowView["Name"]);
		}
	}

	private void bindingNavigatorGoto_Click(object sender, EventArgs e)
	{
		if (bindingNavigatorID.Text.Length == 0)
		{
			return;
		}
		if (numberToolStripMenuItem.Checked)
		{
			int num;
			try
			{
				num = pLUBindingSource.Find("PLUID", bindingNavigatorID.Text);
			}
			catch (Exception)
			{
				num = -1;
			}
			if (num != -1)
			{
				pLUBindingSource.Position = num;
			}
		}
		else if (itemCodeToolStripMenuItem.Checked)
		{
			int num;
			try
			{
				num = pLUBindingSource.Find("Remark", bindingNavigatorID.Text);
			}
			catch (Exception)
			{
				num = -1;
			}
			if (num != -1)
			{
				pLUBindingSource.Position = num;
			}
		}
		else if (indexToolStripMenuItem.Checked)
		{
			int num;
			try
			{
				num = pLUBindingSource.Find("Index", bindingNavigatorID.Text);
			}
			catch (Exception)
			{
				num = -1;
			}
			if (num != -1)
			{
				pLUBindingSource.Position = num;
			}
		}
		else if (nameToolStripMenuItem.Checked)
		{
			int num;
			try
			{
				num = pLUBindingSource.Find("Name", bindingNavigatorID.Text);
			}
			catch (Exception)
			{
				num = -1;
			}
			if (num != -1)
			{
				pLUBindingSource.Position = num;
			}
		}
	}

	private void pLUDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void pLUBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
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

	private void dF_UComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		dF_UNNumericUpDown.Enabled = dF_UComboBox.SelectedIndex == 3;
	}

	private void dF_DComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		dF_DNNumericUpDown.Enabled = dF_DComboBox.SelectedIndex == 3;
	}

	private void DeletePLU()
	{
		foreach (DataGridViewRow selectedRow in pLUDataGridView.SelectedRows)
		{
			if (selectedRow.DataBoundItem is DataRowView dataRowView)
			{
				dataRowView.Row.Delete();
			}
		}
		try
		{
			pLUTableAdapter.Update(eCSDataSet.PLU);
			DataSet_Changed = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void bindingNavigatorDeleteItem_Click(object sender, EventArgs e)
	{
		DeletePLU();
	}

	private ECSDataSet.PLURow GetCurrentRow()
	{
		if (pLUBindingSource.Position == -1)
		{
			return null;
		}
		DataRowView dataRowView = (DataRowView)pLUBindingSource.Current;
		return (ECSDataSet.PLURow)dataRowView.Row;
	}

	private void validToolStripButton_Click(object sender, EventArgs e)
	{
		bool flag = !validToolStripButton.Checked;
		validToolStripButton.Checked = flag;
		eCSDataSet.PLU.PLURowChanged -= PLU_PLURowChanged;
		foreach (DataRowView item in pLUBindingSource)
		{
			PLUvalidChanged = true;
			ECSDataSet.PLURow pLURow = (ECSDataSet.PLURow)item.Row;
			pLURow.Valid = flag;
		}
		eCSDataSet.PLU.PLURowChanged += PLU_PLURowChanged;
		try
		{
			pLUTableAdapter.Update(eCSDataSet.PLU);
			DataSet_Changed = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void pLUDataGridView_CellValueChanged(object sender, DataGridViewCellEventArgs e)
	{
		if (e.RowIndex == -1)
		{
			return;
		}
		if (e.ColumnIndex == 2)
		{
			ECSDataSet.PLURow currentRow = GetCurrentRow();
			if (currentRow != null)
			{
				currentRow.ALPHA = Program.GetAlpha(currentRow.Name);
			}
		}
		if (e.ColumnIndex == 1)
		{
			PLUvalidChanged = true;
		}
	}

	private void valid_checkBox_Click(object sender, EventArgs e)
	{
		PLUvalidChanged = true;
	}

	private void pLUDataGridView_KeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode == Keys.Delete)
		{
			e.Handled = true;
			DeletePLU();
		}
	}

	private void P0_Ethernet_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.PopMdiChild_Ethernet_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: true, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
		if (Program.mf.m_netForm.mf_Docked)
		{
			base.WindowState = FormWindowState.Normal;
			Close();
		}
	}

	private void P0_TMSFile_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.ShowDialog_TMSfile_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: true, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
	}

	private void bindingNavigatorAddNewItem_Click(object sender, EventArgs e)
	{
		ECSDataSet.PLURow pLURow = (ECSDataSet.PLURow)((DataRowView)pLUBindingSource.AddNew()).Row;
		if (pLURow != null)
		{
			pLURow.UnitID = Settings.Default.defaultUnitID;
			unitIDComboBox.SelectedValue = Settings.Default.defaultUnitID;
		}
	}

	private void ADx_Sort_ComboBox_SelectedIndexChanged_Control(ComboBox Sort, NumericUpDown Low, NumericUpDown High, RadioButton D0, RadioButton D1, NumericUpDown Data, Label DiscountTo, Label Mark0, Label VF, Label L0, Label L1)
	{
		if (Sort.SelectedIndex != 0)
		{
			if (Sort.SelectedIndex == 1)
			{
				bool visible = (High.Visible = true);
				Low.Visible = visible;
				int decimalPlaces = (High.DecimalPlaces = Settings.Default.Format_Weight);
				Low.DecimalPlaces = decimalPlaces;
				bool visible2 = (D1.Visible = false);
				D0.Visible = visible2;
				bool visible3 = (Data.Visible = true);
				DiscountTo.Visible = visible3;
				Mark0.Text = InfoLabel_Value_1.Text;
				bool flag4 = (L1.Visible = true);
				bool visible4 = (L0.Visible = flag4);
				VF.Visible = visible4;
			}
			else if (Sort.SelectedIndex == 2)
			{
				bool visible5 = (High.Visible = true);
				Low.Visible = visible5;
				int decimalPlaces2 = (High.DecimalPlaces = 0);
				Low.DecimalPlaces = decimalPlaces2;
				bool visible6 = (D1.Visible = false);
				D0.Visible = visible6;
				bool visible7 = (AD1_Data_NumericUpDown.Visible = true);
				DiscountTo.Visible = visible7;
				Mark0.Text = InfoLabel_Value_2.Text;
				bool flag10 = (L1.Visible = true);
				bool visible8 = (L0.Visible = flag10);
				VF.Visible = visible8;
			}
			else if (Sort.SelectedIndex == 3 || Sort.SelectedIndex == 10)
			{
				bool visible9 = (High.Visible = true);
				Low.Visible = visible9;
				int decimalPlaces3 = (High.DecimalPlaces = Settings.Default.Format_Price);
				Low.DecimalPlaces = decimalPlaces3;
				bool visible10 = (D1.Visible = true);
				D0.Visible = visible10;
				bool visible11 = (Data.Visible = false);
				DiscountTo.Visible = visible11;
				Mark0.Text = InfoLabel_Value_3.Text;
				bool flag16 = (L1.Visible = true);
				bool visible12 = (L0.Visible = flag16);
				VF.Visible = visible12;
			}
			else if (Sort.SelectedIndex <= 7)
			{
				bool visible13 = (High.Visible = false);
				Low.Visible = visible13;
				bool visible14 = (D1.Visible = false);
				D0.Visible = visible14;
				bool visible15 = (AD1_Data_NumericUpDown.Visible = true);
				DiscountTo.Visible = visible15;
				Mark0.Text = "";
				bool flag22 = (L1.Visible = false);
				bool visible16 = (L0.Visible = flag22);
				VF.Visible = visible16;
			}
			else if (Sort.SelectedIndex == 8 || Sort.SelectedIndex == 9)
			{
				bool visible17 = (High.Visible = true);
				Low.Visible = visible17;
				int decimalPlaces4 = (High.DecimalPlaces = Settings.Default.Format_Weight);
				Low.DecimalPlaces = decimalPlaces4;
				bool visible18 = (D1.Visible = true);
				D0.Visible = visible18;
				bool visible19 = (Data.Visible = false);
				DiscountTo.Visible = visible19;
				Mark0.Text = InfoLabel_Value_1.Text;
				bool flag28 = (L1.Visible = true);
				bool visible20 = (L0.Visible = flag28);
				VF.Visible = visible20;
			}
		}
	}

	private void ADx_Sort_ComboBox_SelectedIndexChanged()
	{
		AD1_Data_Panel.Visible = AD1_Sort_ComboBox.SelectedIndex >= 1;
		AD2_Data_Panel.Visible = AD2_Sort_ComboBox.SelectedIndex >= 1;
		AD3_Data_Panel.Visible = AD3_Sort_ComboBox.SelectedIndex >= 1;
		AD4_Data_Panel.Visible = AD4_Sort_ComboBox.SelectedIndex >= 1;
		ADx_Sort_ComboBox_SelectedIndexChanged_Control(AD1_Sort_ComboBox, AD1_VF_Low_NumericUpDown, AD1_VF_High_NumericUpDown, AD1_Data_0_RadioButton, AD1_Data_1_RadioButton, AD1_Data_NumericUpDown, AD1_DiscountTo_Label, AD1_Mark0_Label, AD1_ValueField_Label, AD1_L0_Label, AD1_L1_Label);
		ADx_Sort_ComboBox_SelectedIndexChanged_Control(AD2_Sort_ComboBox, AD2_VF_Low_NumericUpDown, AD2_VF_High_NumericUpDown, AD2_Data_0_RadioButton, AD2_Data_1_RadioButton, AD2_Data_NumericUpDown, AD2_DiscountTo_Label, AD2_Mark0_Label, AD2_ValueField_Label, AD2_L0_Label, AD2_L1_Label);
		ADx_Sort_ComboBox_SelectedIndexChanged_Control(AD3_Sort_ComboBox, AD3_VF_Low_NumericUpDown, AD3_VF_High_NumericUpDown, AD3_Data_0_RadioButton, AD3_Data_1_RadioButton, AD3_Data_NumericUpDown, AD3_DiscountTo_Label, AD3_Mark0_Label, AD3_ValueField_Label, AD3_L0_Label, AD3_L1_Label);
		ADx_Sort_ComboBox_SelectedIndexChanged_Control(AD4_Sort_ComboBox, AD4_VF_Low_NumericUpDown, AD4_VF_High_NumericUpDown, AD4_Data_0_RadioButton, AD4_Data_1_RadioButton, AD4_Data_NumericUpDown, AD4_DiscountTo_Label, AD4_Mark0_Label, AD4_ValueField_Label, AD4_L0_Label, AD4_L1_Label);
		tableLayoutPanel1.Size = new Size(tableLayoutPanel1.Size.Width, TE_label.Location.Y + TE_label.Size.Height);
	}

	private void ADx_Sort_ComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		ADx_Sort_ComboBox_SelectedIndexChanged();
	}

	private void ADx_Data_x_RadioButton_CheckedChanged_Control(object sender, NumericUpDown Data, RadioButton D0, RadioButton D1)
	{
		if (sender == Data)
		{
			if (Data.Value == 0m)
			{
				D0.Checked = true;
			}
			else
			{
				D1.Checked = true;
			}
		}
		else if (D0.Checked)
		{
			if (Data.Value != 0m)
			{
				Data.Value = 0m;
			}
		}
		else if (D1.Checked && Data.Value == 0m)
		{
			Data.Value = 1m;
		}
	}

	private void AD1_Data_x_RadioButton_CheckedChanged(object sender, EventArgs e)
	{
		ADx_Data_x_RadioButton_CheckedChanged_Control(sender, AD1_Data_NumericUpDown, AD1_Data_0_RadioButton, AD1_Data_1_RadioButton);
	}

	private void AD2_Data_x_RadioButton_CheckedChanged(object sender, EventArgs e)
	{
		ADx_Data_x_RadioButton_CheckedChanged_Control(sender, AD2_Data_NumericUpDown, AD2_Data_0_RadioButton, AD2_Data_1_RadioButton);
	}

	private void AD3_Data_x_RadioButton_CheckedChanged(object sender, EventArgs e)
	{
		ADx_Data_x_RadioButton_CheckedChanged_Control(sender, AD3_Data_NumericUpDown, AD3_Data_0_RadioButton, AD3_Data_1_RadioButton);
	}

	private void AD4_Data_x_RadioButton_CheckedChanged(object sender, EventArgs e)
	{
		ADx_Data_x_RadioButton_CheckedChanged_Control(sender, AD4_Data_NumericUpDown, AD4_Data_0_RadioButton, AD4_Data_1_RadioButton);
	}

	private void AD1_VF_xxx_NumericUpDown_ValueChanged(object sender, EventArgs e)
	{
	}

	private void AD2_VF_xxx_NumericUpDown_ValueChanged(object sender, EventArgs e)
	{
	}

	private void AD3_VF_xxx_NumericUpDown_ValueChanged(object sender, EventArgs e)
	{
	}

	private void AD4_VF_xxx_NumericUpDown_ValueChanged(object sender, EventArgs e)
	{
	}

	private void AD1_Day_CheckBox_CheckedChanged(object sender, EventArgs e)
	{
		if (sender == AD1_Day_NumericUpDown)
		{
			bool[] array = Program.ParsePLUDay_value((int)AD1_Day_NumericUpDown.Value);
			AD1_Day0_CheckBox.Checked = array[0];
			AD1_Day1_CheckBox.Checked = array[1];
			AD1_Day2_CheckBox.Checked = array[2];
			AD1_Day3_CheckBox.Checked = array[3];
			AD1_Day4_CheckBox.Checked = array[4];
			AD1_Day5_CheckBox.Checked = array[5];
			AD1_Day6_CheckBox.Checked = array[6];
		}
		else
		{
			AD1_Day_NumericUpDown.Value = Program.FormatPLUDay(AD1_Day0_CheckBox.Checked, AD1_Day1_CheckBox.Checked, AD1_Day2_CheckBox.Checked, AD1_Day3_CheckBox.Checked, AD1_Day4_CheckBox.Checked, AD1_Day5_CheckBox.Checked, AD1_Day6_CheckBox.Checked);
		}
	}

	private void AD2_Day_CheckBox_CheckedChanged(object sender, EventArgs e)
	{
		if (sender == AD2_Day_NumericUpDown)
		{
			bool[] array = Program.ParsePLUDay_value((int)AD2_Day_NumericUpDown.Value);
			AD2_Day0_CheckBox.Checked = array[0];
			AD2_Day1_CheckBox.Checked = array[1];
			AD2_Day2_CheckBox.Checked = array[2];
			AD2_Day3_CheckBox.Checked = array[3];
			AD2_Day4_CheckBox.Checked = array[4];
			AD2_Day5_CheckBox.Checked = array[5];
			AD2_Day6_CheckBox.Checked = array[6];
		}
		else
		{
			AD2_Day_NumericUpDown.Value = Program.FormatPLUDay(AD2_Day0_CheckBox.Checked, AD2_Day1_CheckBox.Checked, AD2_Day2_CheckBox.Checked, AD2_Day3_CheckBox.Checked, AD2_Day4_CheckBox.Checked, AD2_Day5_CheckBox.Checked, AD2_Day6_CheckBox.Checked);
		}
	}

	private void AD3_Day_CheckBox_CheckedChanged(object sender, EventArgs e)
	{
		if (sender == AD3_Day_NumericUpDown)
		{
			bool[] array = Program.ParsePLUDay_value((int)AD3_Day_NumericUpDown.Value);
			AD3_Day0_CheckBox.Checked = array[0];
			AD3_Day1_CheckBox.Checked = array[1];
			AD3_Day2_CheckBox.Checked = array[2];
			AD3_Day3_CheckBox.Checked = array[3];
			AD3_Day4_CheckBox.Checked = array[4];
			AD3_Day5_CheckBox.Checked = array[5];
			AD3_Day6_CheckBox.Checked = array[6];
		}
		else
		{
			AD3_Day_NumericUpDown.Value = Program.FormatPLUDay(AD3_Day0_CheckBox.Checked, AD3_Day1_CheckBox.Checked, AD3_Day2_CheckBox.Checked, AD3_Day3_CheckBox.Checked, AD3_Day4_CheckBox.Checked, AD3_Day5_CheckBox.Checked, AD3_Day6_CheckBox.Checked);
		}
	}

	private void AD4_Day_CheckBox_CheckedChanged(object sender, EventArgs e)
	{
		if (sender == AD4_Day_NumericUpDown)
		{
			bool[] array = Program.ParsePLUDay_value((int)AD4_Day_NumericUpDown.Value);
			AD4_Day0_CheckBox.Checked = array[0];
			AD4_Day1_CheckBox.Checked = array[1];
			AD4_Day2_CheckBox.Checked = array[2];
			AD4_Day3_CheckBox.Checked = array[3];
			AD4_Day4_CheckBox.Checked = array[4];
			AD4_Day5_CheckBox.Checked = array[5];
			AD4_Day6_CheckBox.Checked = array[6];
		}
		else
		{
			AD4_Day_NumericUpDown.Value = Program.FormatPLUDay(AD4_Day0_CheckBox.Checked, AD4_Day1_CheckBox.Checked, AD4_Day2_CheckBox.Checked, AD4_Day3_CheckBox.Checked, AD4_Day4_CheckBox.Checked, AD4_Day5_CheckBox.Checked, AD4_Day6_CheckBox.Checked);
		}
	}

	private void SType_ComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		int num = 0;
		if (SType_ComboBox.SelectedValue != null)
		{
			num = (int)SType_ComboBox.SelectedValue;
		}
		UnitID_Check();
		if (num >= 2 && num <= 6)
		{
			nameTextBox.Enabled = true;
			remarkNumericUpDown.Enabled = false;
			indexTextBox.Enabled = false;
			classIDComboBox.Enabled = false;
			unitIDComboBox.Enabled = true;
			priceNumericUpDown.Enabled = false;
			costNumericUpDown.Enabled = false;
			tareNumericUpDown.Enabled = false;
			taxTypeComboBox.Enabled = false;
			taxTextBox.Enabled = false;
			sspValue1NumericUpDown.Enabled = false;
			sspValue2NumericUpDown.Enabled = false;
			sspValue3NumericUpDown.Enabled = false;
			sspValue4NumericUpDown.Enabled = false;
			sspComboBox1.Enabled = false;
			sspComboBox2.Enabled = false;
			sspComboBox3.Enabled = false;
			sspComboBox4.Enabled = false;
			labelID1ComboBox.Enabled = false;
			barT1ComboBox.Enabled = false;
			barF1NumericUpDown.Enabled = false;
			labelID2ComboBox.Enabled = false;
			barT2ComboBox.Enabled = false;
			barF2NumericUpDown.Enabled = false;
			text1TextBox.Enabled = true;
			text2TextBox.Enabled = true;
			text3TextBox.Enabled = true;
			text4TextBox.Enabled = true;
			text5TextBox.Enabled = true;
			text6TextBox.Enabled = true;
			text7TextBox.Enabled = true;
			pS_SDComboBox.Enabled = false;
			pS_STComboBox.Enabled = false;
			pS_PDComboBox.Enabled = false;
			pS_PTComboBox.Enabled = false;
			pS_UDComboBox.Enabled = false;
			pC_SDNumericUpDown.Enabled = false;
			pC_ST_HNumericUpDown.Enabled = false;
			pC_PDNumericUpDown.Enabled = false;
			pC_PT_HNumericUpDown.Enabled = false;
			pC_UDNumericUpDown.Enabled = false;
			dF_UComboBox.Enabled = false;
			dF_UNNumericUpDown.Enabled = false;
			dF_DComboBox.Enabled = false;
			dF_DNNumericUpDown.Enabled = false;
			tableLayoutPanel1.Enabled = false;
			Bitmap_ComboBox.Enabled = true;
		}
		else if (num == 1)
		{
			nameTextBox.Enabled = true;
			remarkNumericUpDown.Enabled = false;
			indexTextBox.Enabled = false;
			classIDComboBox.Enabled = false;
			unitIDComboBox.Enabled = true;
			priceNumericUpDown.Enabled = false;
			costNumericUpDown.Enabled = false;
			tareNumericUpDown.Enabled = true;
			taxTypeComboBox.Enabled = false;
			taxTextBox.Enabled = false;
			sspValue1NumericUpDown.Enabled = false;
			sspValue2NumericUpDown.Enabled = false;
			sspValue3NumericUpDown.Enabled = false;
			sspValue4NumericUpDown.Enabled = false;
			sspComboBox1.Enabled = false;
			sspComboBox2.Enabled = false;
			sspComboBox3.Enabled = false;
			sspComboBox4.Enabled = false;
			labelID1ComboBox.Enabled = false;
			barT1ComboBox.Enabled = false;
			barF1NumericUpDown.Enabled = false;
			labelID2ComboBox.Enabled = false;
			barT2ComboBox.Enabled = false;
			barF2NumericUpDown.Enabled = false;
			text1TextBox.Enabled = false;
			text2TextBox.Enabled = false;
			text3TextBox.Enabled = false;
			text4TextBox.Enabled = false;
			text5TextBox.Enabled = false;
			text6TextBox.Enabled = false;
			text7TextBox.Enabled = false;
			pS_SDComboBox.Enabled = false;
			pS_STComboBox.Enabled = false;
			pS_PDComboBox.Enabled = false;
			pS_PTComboBox.Enabled = false;
			pS_UDComboBox.Enabled = false;
			pC_SDNumericUpDown.Enabled = false;
			pC_ST_HNumericUpDown.Enabled = false;
			pC_PDNumericUpDown.Enabled = false;
			pC_PT_HNumericUpDown.Enabled = false;
			pC_UDNumericUpDown.Enabled = false;
			dF_UComboBox.Enabled = false;
			dF_UNNumericUpDown.Enabled = false;
			dF_DComboBox.Enabled = false;
			dF_DNNumericUpDown.Enabled = false;
			tableLayoutPanel1.Enabled = false;
			Bitmap_ComboBox.Enabled = false;
		}
		else
		{
			nameTextBox.Enabled = true;
			remarkNumericUpDown.Enabled = true;
			indexTextBox.Enabled = true;
			classIDComboBox.Enabled = true;
			unitIDComboBox.Enabled = true;
			priceNumericUpDown.Enabled = true;
			costNumericUpDown.Enabled = true;
			tareNumericUpDown.Enabled = true;
			taxTypeComboBox.Enabled = true;
			taxTextBox.Enabled = true;
			sspValue1NumericUpDown.Enabled = true;
			sspValue2NumericUpDown.Enabled = true;
			sspValue3NumericUpDown.Enabled = true;
			sspValue4NumericUpDown.Enabled = true;
			sspComboBox1.Enabled = true;
			sspComboBox2.Enabled = true;
			sspComboBox3.Enabled = true;
			sspComboBox4.Enabled = true;
			labelID1ComboBox.Enabled = true;
			barT1ComboBox.Enabled = true;
			barF1NumericUpDown.Enabled = true;
			labelID2ComboBox.Enabled = true;
			barT2ComboBox.Enabled = true;
			barF2NumericUpDown.Enabled = true;
			text1TextBox.Enabled = true;
			text2TextBox.Enabled = true;
			text3TextBox.Enabled = true;
			text4TextBox.Enabled = true;
			text5TextBox.Enabled = true;
			text6TextBox.Enabled = true;
			text7TextBox.Enabled = true;
			pS_SDComboBox.Enabled = true;
			pS_STComboBox.Enabled = true;
			pS_PDComboBox.Enabled = true;
			pS_PTComboBox.Enabled = true;
			pS_UDComboBox.Enabled = true;
			pC_SDNumericUpDown.Enabled = true;
			pC_ST_HNumericUpDown.Enabled = true;
			pC_PDNumericUpDown.Enabled = true;
			pC_PT_HNumericUpDown.Enabled = true;
			pC_UDNumericUpDown.Enabled = true;
			dF_UComboBox.Enabled = true;
			dF_UNNumericUpDown.Enabled = true;
			dF_DComboBox.Enabled = true;
			dF_DNNumericUpDown.Enabled = true;
			tableLayoutPanel1.Enabled = true;
			Bitmap_ComboBox.Enabled = true;
		}
	}

	private void PluForm_Leave(object sender, EventArgs e)
	{
		pLUDataGridView.EndEdit();
		pLUBindingSource.EndEdit();
		if (DataSet_Changed)
		{
			DataSet_Update("PLU");
			DataSet_Changed = false;
		}
	}

	private void timer_savetick_Tick(object sender, EventArgs e)
	{
		long lastInputTime = Program.GetLastInputTime();
		if (lastInputTime > 9000)
		{
			if (!timer_ed)
			{
				PluForm_Leave(null, null);
				timer_ed = true;
			}
		}
		else
		{
			timer_ed = false;
		}
	}

	private void cloneToolStripButton_Click(object sender, EventArgs e)
	{
		try
		{
			pLUDataGridView.EndEdit();
			pLUBindingSource.EndEdit();
			ECSDataSet.PLURow currentRow = GetCurrentRow();
			if (currentRow != null)
			{
				ECSDataSet.PLURow pLURow = eCSDataSet.PLU.NewPLURow();
				object[] itemArray = currentRow.ItemArray;
				itemArray[0] = pLURow.ItemArray[0];
				pLURow.ItemArray = itemArray;
				eCSDataSet.PLU.AddPLURow(pLURow);
				int num = pLUBindingSource.Find("PLUID", itemArray[0]);
				if (num != -1)
				{
					pLUBindingSource.Position = num;
				}
			}
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			pLUBindingSource.CancelEdit();
		}
	}

	private void bindingNavigatorFilter_CheckedChanged(object sender, EventArgs e)
	{
		if (bindingNavigatorFilter.Checked)
		{
			using (FilterForm filterForm = new FilterForm(pLUDataGridView))
			{
				if (filterForm.ShowDialog(this) == DialogResult.OK)
				{
					pLUBindingSource.Filter = filterForm.FilterString;
					if (Program.right == Program.Right.User)
					{
						BindingSource bindingSource = pLUBindingSource;
						bindingSource.Filter = bindingSource.Filter + " AND PLUID >= " + Settings.Default.minUserPLUID;
					}
					FilterAdd_ToolStripButton.Visible = true;
				}
				else
				{
					bindingNavigatorFilter.Checked = false;
					FilterAdd_ToolStripButton.Visible = false;
				}
				return;
			}
		}
		FilterAdd_ToolStripButton.Visible = false;
		if (Program.right == Program.Right.User)
		{
			pLUBindingSource.Filter = "PLUID >= " + Settings.Default.minUserPLUID;
		}
		else
		{
			pLUBindingSource.RemoveFilter();
		}
	}

	private void FilterAdd_ToolStripButton_Click(object sender, EventArgs e)
	{
		using FilterForm filterForm = new FilterForm(pLUDataGridView);
		if (filterForm.ShowDialog(this) == DialogResult.OK)
		{
			BindingSource bindingSource = pLUBindingSource;
			bindingSource.Filter = bindingSource.Filter + " AND " + filterForm.FilterString;
		}
	}

	private void numberToolStripMenuItem_Click(object sender, EventArgs e)
	{
		if (sender == numberToolStripMenuItem)
		{
			numberToolStripMenuItem.Checked = true;
			indexToolStripMenuItem.Checked = false;
			itemCodeToolStripMenuItem.Checked = false;
			nameToolStripMenuItem.Checked = false;
		}
		else if (sender == indexToolStripMenuItem)
		{
			numberToolStripMenuItem.Checked = false;
			indexToolStripMenuItem.Checked = true;
			itemCodeToolStripMenuItem.Checked = false;
			nameToolStripMenuItem.Checked = false;
		}
		else if (sender == itemCodeToolStripMenuItem)
		{
			numberToolStripMenuItem.Checked = false;
			indexToolStripMenuItem.Checked = false;
			itemCodeToolStripMenuItem.Checked = true;
			nameToolStripMenuItem.Checked = false;
		}
		else if (sender == nameToolStripMenuItem)
		{
			numberToolStripMenuItem.Checked = false;
			indexToolStripMenuItem.Checked = false;
			itemCodeToolStripMenuItem.Checked = false;
			nameToolStripMenuItem.Checked = true;
		}
	}

	private void bindingNavigatorID_KeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode == Keys.Return)
		{
			e.Handled = true;
			bindingNavigatorGoto_Click(null, null);
		}
	}

	private void nameTextBox_TextChanged(object sender, EventArgs e)
	{
		Alpha_TextBox.Text = Program.GetAlpha(nameTextBox.Text);
	}

	private void UnitID_Check()
	{
		try
		{
			int num = (int)SType_ComboBox.SelectedValue;
			if (num >= 2 && num <= 6)
			{
				Basic_Measure_Panel.Visible = false;
				Basic_SaveAsWeight_Panel.Visible = false;
				Basic_Tare_Panel.Visible = false;
				Basic_TarePencent_Panel.Visible = false;
				Basic_FixedWeight_Panel.Visible = false;
			}
			else if (num == 1)
			{
				Basic_Measure_Panel.Visible = false;
				Basic_SaveAsWeight_Panel.Visible = false;
				Basic_Tare_Panel.Visible = Settings.Default.Enable_PLU_Tare;
				Basic_TarePencent_Panel.Visible = false;
				Basic_FixedWeight_Panel.Visible = false;
			}
			else
			{
				switch ((int)unitIDComboBox.SelectedValue)
				{
				case 0:
					Basic_Measure_Panel.Visible = false;
					Basic_SaveAsWeight_Panel.Visible = false;
					Basic_Tare_Panel.Visible = false;
					Basic_TarePencent_Panel.Visible = false;
					Basic_FixedWeight_Panel.Visible = false;
					break;
				case 2:
					Basic_Measure_Panel.Visible = Settings.Default.Enable_PLU_MeasureWord;
					Basic_SaveAsWeight_Panel.Visible = Settings.Default.Enable_PLU_PcsSaveInWeight;
					Basic_Tare_Panel.Visible = false;
					Basic_TarePencent_Panel.Visible = false;
					Basic_FixedWeight_Panel.Visible = false;
					Text_7_Panel.Visible = !Measure_CheckBox.Checked;
					if (Measure_CheckBox.Checked)
					{
						text7TextBox.Parent = Basic_Measure_Panel;
						text7TextBox.Bounds = Measure_Pos_TextBox.Bounds;
						text7TextBox.Multiline = false;
					}
					else
					{
						text7TextBox.Parent = textPage;
						text7TextBox.Bounds = text7_Pos_TextBox.Bounds;
						text7TextBox.Parent = Text_7_Panel;
						text7TextBox.Multiline = true;
					}
					text7TextBox.Visible = true;
					break;
				default:
					Basic_Measure_Panel.Visible = false;
					Basic_SaveAsWeight_Panel.Visible = false;
					if (FixedWeight_CheckBox.Checked)
					{
						tareNumericUpDown.Parent = Basic_FixedWeight_Panel;
						tareNumericUpDown.Bounds = FixedWeight_Pos_NumericUpDown.Bounds;
						tareNumericUpDown.Visible = true;
						Basic_Tare_Panel.Visible = false;
						Basic_TarePencent_Panel.Visible = false;
						Basic_FixedWeight_Panel.Visible = true;
						break;
					}
					tareNumericUpDown.Parent = Basic_Tare_Panel;
					tareNumericUpDown.Bounds = Tare_Pos_NumericUpDown.Bounds;
					tareNumericUpDown.Visible = true;
					Basic_Tare_Panel.Visible = Settings.Default.Enable_PLU_Tare;
					if (TarePencent_CheckBox.Checked)
					{
						Basic_FixedWeight_Panel.Visible = false;
						Basic_TarePencent_Panel.Visible = true;
						FlagValue_NumericUpDown.Parent = Basic_TarePencent_Panel;
						FlagValue_NumericUpDown.Bounds = TarePencent_Pos_NumericUpDown.Bounds;
						FlagValue_NumericUpDown.Visible = true;
						TarePencent_Pos_Label.Visible = true;
						FlagValue_NumericUpDown.Maximum = 99m;
						FlagValue_NumericUpDown.Minimum = 0m;
					}
					else
					{
						Basic_FixedWeight_Panel.Visible = Settings.Default.Enable_PLU_FixedWeight;
						Basic_TarePencent_Panel.Visible = Settings.Default.Enable_PLU_PercentTare;
						FlagValue_NumericUpDown.Visible = false;
						TarePencent_Pos_Label.Visible = false;
					}
					break;
				}
			}
		}
		catch (Exception)
		{
			Basic_Measure_Panel.Visible = false;
			Basic_Tare_Panel.Visible = false;
			Basic_TarePencent_Panel.Visible = false;
			Basic_FixedWeight_Panel.Visible = false;
		}
		Basic_TableLayoutPanel.Size = new Size(Basic_TableLayoutPanel.Size.Width, TE2_label.Location.Y + TE2_label.Size.Height);
	}

	private void unitIDComboBox_SelectedValueChanged(object sender, EventArgs e)
	{
		Flag_NumericUpDown.Value = 0m;
		UnitID_Check();
	}

	private void Measure_CheckBox_Click(object sender, EventArgs e)
	{
		text7TextBox.Text = "";
		Flag_Changed(sender, e);
	}

	private void Flag_NumericUpDown_ValueChanged(object sender, EventArgs e)
	{
		if (sender == Flag_NumericUpDown)
		{
			int num = (int)Flag_NumericUpDown.Value;
			Measure_CheckBox.Checked = (num & 1) != 0;
			SaveAsWeight_CheckBox.Checked = (num & 2) != 0;
			FixedWeight_CheckBox.Checked = (num & 2) != 0;
			TarePencent_CheckBox.Checked = (num & 4) != 0;
		}
		else
		{
			int num2 = 0;
			if (Measure_CheckBox.Checked)
			{
				num2 |= 1;
			}
			if (SaveAsWeight_CheckBox.Checked)
			{
				num2 |= 2;
			}
			if (FixedWeight_CheckBox.Checked)
			{
				num2 |= 2;
			}
			if (TarePencent_CheckBox.Checked)
			{
				num2 |= 4;
			}
			Flag_NumericUpDown.ValueChanged -= Flag_NumericUpDown_ValueChanged;
			Flag_NumericUpDown.Value = num2;
			Flag_NumericUpDown.ValueChanged += Flag_NumericUpDown_ValueChanged;
		}
		UnitID_Check();
	}

	private void Flag_Changed(object sender, EventArgs e)
	{
		Flag_NumericUpDown_ValueChanged(sender, e);
	}

	private void taxTypeComboBox_SelectedValueChanged(object sender, EventArgs e)
	{
		try
		{
			int num = (int)taxTypeComboBox.SelectedValue;
			if (num >= 1)
			{
				Basic_TaxRate_Panel.Visible = true;
			}
			else
			{
				Basic_TaxRate_Panel.Visible = false;
			}
		}
		catch (Exception)
		{
			Basic_TaxRate_Panel.Visible = false;
		}
	}

	private void Bitmap_ComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			string text = (string)dataRowView["PicSize"];
			if (text.Length > 0)
			{
				e.Value = string.Format("{0} - {1} ({2})", dataRowView["ID"], dataRowView["Name"], dataRowView["PicSize"]);
			}
			else
			{
				e.Value = string.Format("{0} - {1}", dataRowView["ID"], dataRowView["Name"]);
			}
		}
	}

	private void nameTextBox_KeyDown(object sender, KeyEventArgs e)
	{
		Program.TextSizeChange((TextBox)sender, e.KeyCode);
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.PluForm));
		System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle = new System.Windows.Forms.DataGridViewCellStyle();
		this.splitContainer = new System.Windows.Forms.SplitContainer();
		this.pLUDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Valid = new System.Windows.Forms.DataGridViewCheckBoxColumn();
		this.dataGridViewTextBoxColumn36 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.priceTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.costTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.tareTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.unitBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.eCSDataSet = new ECS.ECSDataSet();
		this.ClassID = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.classBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.Remark = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Index = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.TaxTypeColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.pLU_TaxTypeBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uiDataSet = new ECS.UIDataSet();
		this.taxTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sspValue1Column = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sspValue2Column = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sspValue3Column = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sspValue4Column = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.LabelID1 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.labelBindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.BarT1 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.barcodeBindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.BarF1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.LabelID2 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.labelBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.BarT2 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.barcodeBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.BarF2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Bitmap = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.bitmapBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.Text1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Text2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Text3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Text4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Text5 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Text6 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Text7 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.tabControl = new System.Windows.Forms.TabControl();
		this.basicPage = new System.Windows.Forms.TabPage();
		this.Basic_TableLayoutPanel = new System.Windows.Forms.TableLayoutPanel();
		this.Basic_Unit_Panel = new System.Windows.Forms.Panel();
		this.unitIDLabel = new System.Windows.Forms.Label();
		this.unitIDComboBox = new System.Windows.Forms.ComboBox();
		this.Basic_Class_Panel = new System.Windows.Forms.Panel();
		this.classIDLabel = new System.Windows.Forms.Label();
		this.classIDComboBox = new System.Windows.Forms.ComboBox();
		this.Basic_Fix1_Panel = new System.Windows.Forms.Panel();
		this.Debug_Label = new System.Windows.Forms.Label();
		this.tareNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.pLUIDLabel = new System.Windows.Forms.Label();
		this.FlagValue_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.pLUIDNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.valid_checkBox = new System.Windows.Forms.CheckBox();
		this.Flag_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.imEx_Label = new System.Windows.Forms.Label();
		this.nameLabel = new System.Windows.Forms.Label();
		this.nameTextBox = new System.Windows.Forms.TextBox();
		this.Basic_Measure_Panel = new System.Windows.Forms.Panel();
		this.Measure_CheckBox = new System.Windows.Forms.CheckBox();
		this.Measure_Pos_TextBox = new System.Windows.Forms.TextBox();
		this.Basic_Fix3_Panel = new System.Windows.Forms.Panel();
		this.priceLabel1 = new System.Windows.Forms.Label();
		this.priceNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.costNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.costLabel1 = new System.Windows.Forms.Label();
		this.Basic_Tare_Panel = new System.Windows.Forms.Panel();
		this.Tare_Pos_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.tareLabel1 = new System.Windows.Forms.Label();
		this.Basic_TarePencent_Panel = new System.Windows.Forms.Panel();
		this.TarePencent_Pos_Label = new System.Windows.Forms.Label();
		this.TarePencent_Pos_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.TarePencent_CheckBox = new System.Windows.Forms.CheckBox();
		this.Basic_FixedWeight_Panel = new System.Windows.Forms.Panel();
		this.FixedWeight_Pos_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.FixedWeight_CheckBox = new System.Windows.Forms.CheckBox();
		this.Basic_ItemCode_Panel = new System.Windows.Forms.Panel();
		this.remarkLabel = new System.Windows.Forms.Label();
		this.remarkNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.Basic_ALPHA_Panel = new System.Windows.Forms.Panel();
		this.alpha_label = new System.Windows.Forms.Label();
		this.Alpha_TextBox = new System.Windows.Forms.TextBox();
		this.Basic_TaxRate_Panel = new System.Windows.Forms.Panel();
		this.taxLabel = new System.Windows.Forms.Label();
		this.taxTextBox = new System.Windows.Forms.TextBox();
		this.Basic_SSP1_Panel = new System.Windows.Forms.Panel();
		this.sspValue1Label = new System.Windows.Forms.Label();
		this.sspComboBox1 = new System.Windows.Forms.ComboBox();
		this.sspValue1NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.Basic_SType_Panel = new System.Windows.Forms.Panel();
		this.SType_Label = new System.Windows.Forms.Label();
		this.SType_ComboBox = new System.Windows.Forms.ComboBox();
		this.Basic_TaxType_Panel = new System.Windows.Forms.Panel();
		this.taxTypeLabel = new System.Windows.Forms.Label();
		this.taxTypeComboBox = new System.Windows.Forms.ComboBox();
		this.Basic_SSP4_Panel = new System.Windows.Forms.Panel();
		this.sspValue4Label = new System.Windows.Forms.Label();
		this.sspValue4NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.sspComboBox4 = new System.Windows.Forms.ComboBox();
		this.Basic_SSP3_Panel = new System.Windows.Forms.Panel();
		this.sspValue3Label = new System.Windows.Forms.Label();
		this.sspComboBox3 = new System.Windows.Forms.ComboBox();
		this.sspValue3NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.Basic_SSP2_Panel = new System.Windows.Forms.Panel();
		this.sspComboBox2 = new System.Windows.Forms.ComboBox();
		this.sspValue2Label = new System.Windows.Forms.Label();
		this.sspValue2NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.TE2_label = new System.Windows.Forms.Label();
		this.Basic_Index_Panel = new System.Windows.Forms.Panel();
		this.indexLabel = new System.Windows.Forms.Label();
		this.indexTextBox = new System.Windows.Forms.TextBox();
		this.Basic_SaveAsWeight_Panel = new System.Windows.Forms.Panel();
		this.SaveAsWeight_CheckBox = new System.Windows.Forms.CheckBox();
		this.labelPage = new System.Windows.Forms.TabPage();
		this.Print_TableLayoutPanel = new System.Windows.Forms.TableLayoutPanel();
		this.Print_Bill1_Panel = new System.Windows.Forms.Panel();
		this.labelID1ComboBox = new System.Windows.Forms.ComboBox();
		this.barT1ComboBox = new System.Windows.Forms.ComboBox();
		this.barF1NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.labelID1Label = new System.Windows.Forms.Label();
		this.barF1Label1 = new System.Windows.Forms.Label();
		this.barT1Label1 = new System.Windows.Forms.Label();
		this.Print_Bill2_Panel = new System.Windows.Forms.Panel();
		this.labelID2ComboBox = new System.Windows.Forms.ComboBox();
		this.barF2Label1 = new System.Windows.Forms.Label();
		this.barT2Label1 = new System.Windows.Forms.Label();
		this.barT2ComboBox = new System.Windows.Forms.ComboBox();
		this.barF2NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.labelID2Label = new System.Windows.Forms.Label();
		this.Print_Bitmap_Panel = new System.Windows.Forms.Panel();
		this.Bitmap_ComboBox = new System.Windows.Forms.ComboBox();
		this.bitmapBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.bitmapLabel = new System.Windows.Forms.Label();
		this.textPage = new System.Windows.Forms.TabPage();
		this.Text_TableLayoutPanel = new System.Windows.Forms.TableLayoutPanel();
		this.Text_1_Panel = new System.Windows.Forms.Panel();
		this.text1TextBox = new System.Windows.Forms.TextBox();
		this.text1Label = new System.Windows.Forms.Label();
		this.Text_2_Panel = new System.Windows.Forms.Panel();
		this.text2TextBox = new System.Windows.Forms.TextBox();
		this.text2Label = new System.Windows.Forms.Label();
		this.Text_3_Panel = new System.Windows.Forms.Panel();
		this.text3TextBox = new System.Windows.Forms.TextBox();
		this.text3Label = new System.Windows.Forms.Label();
		this.Text_4_Panel = new System.Windows.Forms.Panel();
		this.text4TextBox = new System.Windows.Forms.TextBox();
		this.text4Label = new System.Windows.Forms.Label();
		this.Text_5_Panel = new System.Windows.Forms.Panel();
		this.text5TextBox = new System.Windows.Forms.TextBox();
		this.text5Label = new System.Windows.Forms.Label();
		this.Text_6_Panel = new System.Windows.Forms.Panel();
		this.text6TextBox = new System.Windows.Forms.TextBox();
		this.text6Label = new System.Windows.Forms.Label();
		this.Text_7_Panel = new System.Windows.Forms.Panel();
		this.text7_Pos_TextBox = new System.Windows.Forms.TextBox();
		this.text7TextBox = new System.Windows.Forms.TextBox();
		this.text7Label = new System.Windows.Forms.Label();
		this.timePage = new System.Windows.Forms.TabPage();
		this.tableLayoutPanel2 = new System.Windows.Forms.TableLayoutPanel();
		this.Time_TimeSD_1_Panel = new System.Windows.Forms.Panel();
		this.pS_SDLabel = new System.Windows.Forms.Label();
		this.pS_SDComboBox = new System.Windows.Forms.ComboBox();
		this.pLUPSDateBindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.Time_TimeST_1_Panel = new System.Windows.Forms.Panel();
		this.pS_STLabel = new System.Windows.Forms.Label();
		this.pS_STComboBox = new System.Windows.Forms.ComboBox();
		this.pLUPSTimeBindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.Time_TimePD_1_Panel = new System.Windows.Forms.Panel();
		this.pS_PDLabel = new System.Windows.Forms.Label();
		this.pS_PDComboBox = new System.Windows.Forms.ComboBox();
		this.pLUPSDateBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.Time_TimePT_1_Panel = new System.Windows.Forms.Panel();
		this.pS_PTLabel = new System.Windows.Forms.Label();
		this.pS_PTComboBox = new System.Windows.Forms.ComboBox();
		this.pLUPSTimeBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.Time_TimeUD_1_Panel = new System.Windows.Forms.Panel();
		this.pS_UDLabel = new System.Windows.Forms.Label();
		this.pS_UDComboBox = new System.Windows.Forms.ComboBox();
		this.pLUPSDateBindingSource3 = new System.Windows.Forms.BindingSource(this.components);
		this.Time_TimeSD_2_Panel = new System.Windows.Forms.Panel();
		this.pC_SDLabel = new System.Windows.Forms.Label();
		this.pC_SDNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.Time_TimeST_2_Panel = new System.Windows.Forms.Panel();
		this.pC_STLabel = new System.Windows.Forms.Label();
		this.pC_ST_HNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.Time_TimePD_2_Panel = new System.Windows.Forms.Panel();
		this.pC_PDLabel = new System.Windows.Forms.Label();
		this.pC_PDNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.Time_TimePT_2_Panel = new System.Windows.Forms.Panel();
		this.pC_PTLabel = new System.Windows.Forms.Label();
		this.pC_PT_HNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.Time_TimeUD_2_Panel = new System.Windows.Forms.Panel();
		this.pC_UDLabel = new System.Windows.Forms.Label();
		this.pC_UDNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.discountPage = new System.Windows.Forms.TabPage();
		this.tableLayoutPanel1 = new System.Windows.Forms.TableLayoutPanel();
		this.TE_label = new System.Windows.Forms.Label();
		this.AD4_Data_Panel = new System.Windows.Forms.Panel();
		this.AD4_Day_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD4_L1_Label = new System.Windows.Forms.Label();
		this.AD4_Data_1_RadioButton = new System.Windows.Forms.RadioButton();
		this.AD4_Data_0_RadioButton = new System.Windows.Forms.RadioButton();
		this.AD4_Day0_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD4_L0_Label = new System.Windows.Forms.Label();
		this.AD4_Day6_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD4_Day5_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD4_Day4_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD4_VF_High_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD4_EnableDays_Label = new System.Windows.Forms.Label();
		this.AD4_ValueField_Label = new System.Windows.Forms.Label();
		this.AD4_Day3_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD4_VF_Low_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD4_Day2_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD4_DiscountTo_Label = new System.Windows.Forms.Label();
		this.AD4_Day1_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD4_Data_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD4_Mark0_Label = new System.Windows.Forms.Label();
		this.AD4_Sort_Panel = new System.Windows.Forms.Panel();
		this.AD4_Sort_Label = new System.Windows.Forms.Label();
		this.AD4_Sort_ComboBox = new System.Windows.Forms.ComboBox();
		this.pLUDASortBindingSource4 = new System.Windows.Forms.BindingSource(this.components);
		this.AD3_Data_Panel = new System.Windows.Forms.Panel();
		this.AD3_Day_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD3_L1_Label = new System.Windows.Forms.Label();
		this.AD3_Data_1_RadioButton = new System.Windows.Forms.RadioButton();
		this.AD3_Data_0_RadioButton = new System.Windows.Forms.RadioButton();
		this.AD3_L0_Label = new System.Windows.Forms.Label();
		this.AD3_Day0_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD3_Day6_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD3_Day5_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD3_Day4_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD3_VF_High_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD3_EnableDays_Label = new System.Windows.Forms.Label();
		this.AD3_ValueField_Label = new System.Windows.Forms.Label();
		this.AD3_Day3_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD3_VF_Low_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD3_Day2_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD3_DiscountTo_Label = new System.Windows.Forms.Label();
		this.AD3_Day1_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD3_Data_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD3_Mark0_Label = new System.Windows.Forms.Label();
		this.AD3_Sort_Panel = new System.Windows.Forms.Panel();
		this.AD3_Sort_Label = new System.Windows.Forms.Label();
		this.AD3_Sort_ComboBox = new System.Windows.Forms.ComboBox();
		this.pLUDASortBindingSource3 = new System.Windows.Forms.BindingSource(this.components);
		this.AD2_Sort_Panel = new System.Windows.Forms.Panel();
		this.AD2_Sort_Label = new System.Windows.Forms.Label();
		this.AD2_Sort_ComboBox = new System.Windows.Forms.ComboBox();
		this.pLUDASortBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.AD1_Sort_Panel = new System.Windows.Forms.Panel();
		this.AD1_Sort_Label = new System.Windows.Forms.Label();
		this.AD1_Sort_ComboBox = new System.Windows.Forms.ComboBox();
		this.pLUDASortBindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.AD1_Data_Panel = new System.Windows.Forms.Panel();
		this.AD1_Day_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD1_L1_Label = new System.Windows.Forms.Label();
		this.AD1_Data_1_RadioButton = new System.Windows.Forms.RadioButton();
		this.AD1_L0_Label = new System.Windows.Forms.Label();
		this.AD1_Data_0_RadioButton = new System.Windows.Forms.RadioButton();
		this.AD1_Day0_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD1_Day6_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD1_Day5_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD1_Day4_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD1_VF_High_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD1_EnableDays_Label = new System.Windows.Forms.Label();
		this.AD1_ValueField_Label = new System.Windows.Forms.Label();
		this.AD1_Day3_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD1_VF_Low_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD1_Day2_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD1_DiscountTo_Label = new System.Windows.Forms.Label();
		this.AD1_Day1_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD1_Data_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD1_Mark0_Label = new System.Windows.Forms.Label();
		this.InfoPanel = new System.Windows.Forms.Panel();
		this.InfoLabel_Transaction_1 = new System.Windows.Forms.Label();
		this.InfoLabel_Transaction_0 = new System.Windows.Forms.Label();
		this.InfoLabel_Transaction = new System.Windows.Forms.Label();
		this.InfoLabel_DiscountTo = new System.Windows.Forms.Label();
		this.InfoLabel_Day6 = new System.Windows.Forms.Label();
		this.InfoLabel_Day5 = new System.Windows.Forms.Label();
		this.InfoLabel_Day4 = new System.Windows.Forms.Label();
		this.InfoLabel_Day3 = new System.Windows.Forms.Label();
		this.InfoLabel_Day2 = new System.Windows.Forms.Label();
		this.InfoLabel_Day1 = new System.Windows.Forms.Label();
		this.InfoLabel_Value_3 = new System.Windows.Forms.Label();
		this.InfoLabel_Value_2 = new System.Windows.Forms.Label();
		this.InfoLabel_Value_1 = new System.Windows.Forms.Label();
		this.InfoLabel_Day0 = new System.Windows.Forms.Label();
		this.InfoLabel_EnableDays = new System.Windows.Forms.Label();
		this.InfoLabel_ValueField = new System.Windows.Forms.Label();
		this.AD2_Data_Panel = new System.Windows.Forms.Panel();
		this.AD2_Day_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD2_L1_Label = new System.Windows.Forms.Label();
		this.AD2_L0_Label = new System.Windows.Forms.Label();
		this.AD2_Data_1_RadioButton = new System.Windows.Forms.RadioButton();
		this.AD2_Data_0_RadioButton = new System.Windows.Forms.RadioButton();
		this.AD2_Day0_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD2_Day6_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD2_Day5_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD2_Day4_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD2_VF_High_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD2_EnableDays_Label = new System.Windows.Forms.Label();
		this.AD2_ValueField_Label = new System.Windows.Forms.Label();
		this.AD2_Day3_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD2_VF_Low_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD2_Day2_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD2_DiscountTo_Label = new System.Windows.Forms.Label();
		this.AD2_Day1_CheckBox = new System.Windows.Forms.CheckBox();
		this.AD2_Data_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.AD2_Mark0_Label = new System.Windows.Forms.Label();
		this.label1 = new System.Windows.Forms.Label();
		this.dF_ULabel = new System.Windows.Forms.Label();
		this.dF_UComboBox = new System.Windows.Forms.ComboBox();
		this.pLUDFUBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.dF_DLabel = new System.Windows.Forms.Label();
		this.dF_DComboBox = new System.Windows.Forms.ComboBox();
		this.pLUDFDBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.dF_UNNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.dF_DNNumericUpDown = new System.Windows.Forms.NumericUpDown();
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
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.cloneToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorID = new System.Windows.Forms.ToolStripTextBox();
		this.gotoType_ToolStripDropDownButton = new System.Windows.Forms.ToolStripDropDownButton();
		this.numberToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.itemCodeToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.indexToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.nameToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.bindingNavigatorGoto = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorFilter = new System.Windows.Forms.ToolStripButton();
		this.FilterAdd_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.validToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.P0_TMSFile_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.P0_Ethernet_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.custom1TableAdapter = new ECS.ECSDataSetTableAdapters.Custom1TableAdapter();
		this.custom2TableAdapter = new ECS.ECSDataSetTableAdapters.Custom2TableAdapter();
		this.custom3TableAdapter = new ECS.ECSDataSetTableAdapters.Custom3TableAdapter();
		this.custom4TableAdapter = new ECS.ECSDataSetTableAdapters.Custom4TableAdapter();
		this.notifyIcon1 = new System.Windows.Forms.NotifyIcon(this.components);
		this.timer_savetick = new System.Windows.Forms.Timer(this.components);
		this.ssp4BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.ssp3BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.ssp2BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.ssp1BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.pLUTableAdapter = new ECS.ECSDataSetTableAdapters.PLUTableAdapter();
		this.classTableAdapter = new ECS.ECSDataSetTableAdapters.ClassTableAdapter();
		this.labelTableAdapter = new ECS.ECSDataSetTableAdapters.LabelTableAdapter();
		this.barcodeTableAdapter = new ECS.ECSDataSetTableAdapters.BarcodeTableAdapter();
		this.splitContainer.Panel1.SuspendLayout();
		this.splitContainer.Panel2.SuspendLayout();
		this.splitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.classBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLU_TaxTypeBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingSource1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingSource2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.bitmapBindingSource2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingSource).BeginInit();
		this.tabControl.SuspendLayout();
		this.basicPage.SuspendLayout();
		this.Basic_TableLayoutPanel.SuspendLayout();
		this.Basic_Unit_Panel.SuspendLayout();
		this.Basic_Class_Panel.SuspendLayout();
		this.Basic_Fix1_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.tareNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.FlagValue_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLUIDNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.Flag_NumericUpDown).BeginInit();
		this.Basic_Measure_Panel.SuspendLayout();
		this.Basic_Fix3_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.priceNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.costNumericUpDown).BeginInit();
		this.Basic_Tare_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.Tare_Pos_NumericUpDown).BeginInit();
		this.Basic_TarePencent_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.TarePencent_Pos_NumericUpDown).BeginInit();
		this.Basic_FixedWeight_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.FixedWeight_Pos_NumericUpDown).BeginInit();
		this.Basic_ItemCode_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.remarkNumericUpDown).BeginInit();
		this.Basic_ALPHA_Panel.SuspendLayout();
		this.Basic_TaxRate_Panel.SuspendLayout();
		this.Basic_SSP1_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.sspValue1NumericUpDown).BeginInit();
		this.Basic_SType_Panel.SuspendLayout();
		this.Basic_TaxType_Panel.SuspendLayout();
		this.Basic_SSP4_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.sspValue4NumericUpDown).BeginInit();
		this.Basic_SSP3_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.sspValue3NumericUpDown).BeginInit();
		this.Basic_SSP2_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.sspValue2NumericUpDown).BeginInit();
		this.Basic_Index_Panel.SuspendLayout();
		this.Basic_SaveAsWeight_Panel.SuspendLayout();
		this.labelPage.SuspendLayout();
		this.Print_TableLayoutPanel.SuspendLayout();
		this.Print_Bill1_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.barF1NumericUpDown).BeginInit();
		this.Print_Bill2_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.barF2NumericUpDown).BeginInit();
		this.Print_Bitmap_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.bitmapBindingSource).BeginInit();
		this.textPage.SuspendLayout();
		this.Text_TableLayoutPanel.SuspendLayout();
		this.Text_1_Panel.SuspendLayout();
		this.Text_2_Panel.SuspendLayout();
		this.Text_3_Panel.SuspendLayout();
		this.Text_4_Panel.SuspendLayout();
		this.Text_5_Panel.SuspendLayout();
		this.Text_6_Panel.SuspendLayout();
		this.Text_7_Panel.SuspendLayout();
		this.timePage.SuspendLayout();
		this.tableLayoutPanel2.SuspendLayout();
		this.Time_TimeSD_1_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUPSDateBindingSource1).BeginInit();
		this.Time_TimeST_1_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUPSTimeBindingSource1).BeginInit();
		this.Time_TimePD_1_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUPSDateBindingSource2).BeginInit();
		this.Time_TimePT_1_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUPSTimeBindingSource2).BeginInit();
		this.Time_TimeUD_1_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUPSDateBindingSource3).BeginInit();
		this.Time_TimeSD_2_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pC_SDNumericUpDown).BeginInit();
		this.Time_TimeST_2_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pC_ST_HNumericUpDown).BeginInit();
		this.Time_TimePD_2_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pC_PDNumericUpDown).BeginInit();
		this.Time_TimePT_2_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pC_PT_HNumericUpDown).BeginInit();
		this.Time_TimeUD_2_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pC_UDNumericUpDown).BeginInit();
		this.discountPage.SuspendLayout();
		this.tableLayoutPanel1.SuspendLayout();
		this.AD4_Data_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.AD4_Day_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.AD4_VF_High_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.AD4_VF_Low_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.AD4_Data_NumericUpDown).BeginInit();
		this.AD4_Sort_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUDASortBindingSource4).BeginInit();
		this.AD3_Data_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.AD3_Day_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.AD3_VF_High_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.AD3_VF_Low_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.AD3_Data_NumericUpDown).BeginInit();
		this.AD3_Sort_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUDASortBindingSource3).BeginInit();
		this.AD2_Sort_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUDASortBindingSource2).BeginInit();
		this.AD1_Sort_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUDASortBindingSource1).BeginInit();
		this.AD1_Data_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.AD1_Day_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.AD1_VF_High_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.AD1_VF_Low_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.AD1_Data_NumericUpDown).BeginInit();
		this.InfoPanel.SuspendLayout();
		this.AD2_Data_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.AD2_Day_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.AD2_VF_High_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.AD2_VF_Low_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.AD2_Data_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLUDFUBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLUDFDBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.dF_UNNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.dF_DNNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingNavigator).BeginInit();
		this.pLUBindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.ssp4BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ssp3BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ssp2BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ssp1BindingSource).BeginInit();
		base.SuspendLayout();
		this.splitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer, "splitContainer");
		this.splitContainer.Name = "splitContainer";
		resources.ApplyResources(this.splitContainer.Panel1, "splitContainer.Panel1");
		this.splitContainer.Panel1.Controls.Add(this.pLUDataGridView);
		this.splitContainer.Panel2.Controls.Add(this.tabControl);
		this.pLUDataGridView.AllowUserToAddRows = false;
		this.pLUDataGridView.AutoGenerateColumns = false;
		this.pLUDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.pLUDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.pLUDataGridView, "pLUDataGridView");
		this.pLUDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.pLUDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn1, this.Valid, this.dataGridViewTextBoxColumn36, this.priceTextBoxColumn, this.costTextBoxColumn, this.tareTextBoxColumn, this.dataGridViewTextBoxColumn4, this.ClassID, this.Remark, this.Index, this.TaxTypeColumn, this.taxTextBoxColumn, this.sspValue1Column, this.sspValue2Column, this.sspValue3Column, this.sspValue4Column, this.LabelID1, this.BarT1, this.BarF1, this.LabelID2, this.BarT2, this.BarF2, this.Bitmap, this.Text1, this.Text2, this.Text3, this.Text4, this.Text5, this.Text6, this.Text7);
		this.pLUDataGridView.DataSource = this.pLUBindingSource;
		this.pLUDataGridView.Name = "pLUDataGridView";
		this.pLUDataGridView.RowTemplate.Height = 23;
		this.pLUDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.pLUDataGridView.CellValueChanged += new System.Windows.Forms.DataGridViewCellEventHandler(pLUDataGridView_CellValueChanged);
		this.pLUDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(pLUDataGridView_DataError);
		this.pLUDataGridView.KeyDown += new System.Windows.Forms.KeyEventHandler(pLUDataGridView_KeyDown);
		this.dataGridViewTextBoxColumn1.DataPropertyName = "PLUID";
		this.dataGridViewTextBoxColumn1.Frozen = true;
		resources.ApplyResources(this.dataGridViewTextBoxColumn1, "dataGridViewTextBoxColumn1");
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.Valid.DataPropertyName = "Valid";
		resources.ApplyResources(this.Valid, "Valid");
		this.Valid.Name = "Valid";
		this.Valid.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.dataGridViewTextBoxColumn36.DataPropertyName = "Name";
		resources.ApplyResources(this.dataGridViewTextBoxColumn36, "dataGridViewTextBoxColumn36");
		this.dataGridViewTextBoxColumn36.Name = "dataGridViewTextBoxColumn36";
		this.priceTextBoxColumn.DataPropertyName = "Price";
		dataGridViewCellStyle.NullValue = null;
		this.priceTextBoxColumn.DefaultCellStyle = dataGridViewCellStyle;
		resources.ApplyResources(this.priceTextBoxColumn, "priceTextBoxColumn");
		this.priceTextBoxColumn.Name = "priceTextBoxColumn";
		this.costTextBoxColumn.DataPropertyName = "Cost";
		resources.ApplyResources(this.costTextBoxColumn, "costTextBoxColumn");
		this.costTextBoxColumn.Name = "costTextBoxColumn";
		this.tareTextBoxColumn.DataPropertyName = "Tare";
		resources.ApplyResources(this.tareTextBoxColumn, "tareTextBoxColumn");
		this.tareTextBoxColumn.Name = "tareTextBoxColumn";
		this.dataGridViewTextBoxColumn4.DataPropertyName = "UnitID";
		this.dataGridViewTextBoxColumn4.DataSource = this.unitBindingSource;
		this.dataGridViewTextBoxColumn4.DisplayMember = "Name";
		resources.ApplyResources(this.dataGridViewTextBoxColumn4, "dataGridViewTextBoxColumn4");
		this.dataGridViewTextBoxColumn4.Name = "dataGridViewTextBoxColumn4";
		this.dataGridViewTextBoxColumn4.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.dataGridViewTextBoxColumn4.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.dataGridViewTextBoxColumn4.ValueMember = "UnitID";
		this.unitBindingSource.DataMember = "Unit";
		this.unitBindingSource.DataSource = this.eCSDataSet;
		this.unitBindingSource.Filter = "[Name] <> '#NULL#'";
		this.unitBindingSource.Sort = "UnitID";
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.ClassID.DataPropertyName = "ClassID";
		this.ClassID.DataSource = this.classBindingSource;
		this.ClassID.DisplayMember = "Name";
		resources.ApplyResources(this.ClassID, "ClassID");
		this.ClassID.Name = "ClassID";
		this.ClassID.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.ClassID.ValueMember = "ClassID";
		this.classBindingSource.DataMember = "Class";
		this.classBindingSource.DataSource = this.eCSDataSet;
		this.classBindingSource.Sort = "ClassID";
		this.Remark.DataPropertyName = "Remark";
		resources.ApplyResources(this.Remark, "Remark");
		this.Remark.Name = "Remark";
		this.Index.DataPropertyName = "Index";
		resources.ApplyResources(this.Index, "Index");
		this.Index.Name = "Index";
		this.TaxTypeColumn.DataPropertyName = "TaxType";
		this.TaxTypeColumn.DataSource = this.pLU_TaxTypeBindingSource;
		this.TaxTypeColumn.DisplayMember = "Display";
		resources.ApplyResources(this.TaxTypeColumn, "TaxTypeColumn");
		this.TaxTypeColumn.Name = "TaxTypeColumn";
		this.TaxTypeColumn.ValueMember = "Value";
		this.pLU_TaxTypeBindingSource.DataMember = "PLU_TaxType";
		this.pLU_TaxTypeBindingSource.DataSource = this.uiDataSet;
		this.pLU_TaxTypeBindingSource.Sort = "Value";
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.taxTextBoxColumn.DataPropertyName = "Tax";
		resources.ApplyResources(this.taxTextBoxColumn, "taxTextBoxColumn");
		this.taxTextBoxColumn.Name = "taxTextBoxColumn";
		this.sspValue1Column.DataPropertyName = "SspValue1";
		resources.ApplyResources(this.sspValue1Column, "sspValue1Column");
		this.sspValue1Column.Name = "sspValue1Column";
		this.sspValue2Column.DataPropertyName = "SspValue2";
		resources.ApplyResources(this.sspValue2Column, "sspValue2Column");
		this.sspValue2Column.Name = "sspValue2Column";
		this.sspValue3Column.DataPropertyName = "SspValue3";
		resources.ApplyResources(this.sspValue3Column, "sspValue3Column");
		this.sspValue3Column.Name = "sspValue3Column";
		this.sspValue4Column.DataPropertyName = "SspValue4";
		resources.ApplyResources(this.sspValue4Column, "sspValue4Column");
		this.sspValue4Column.Name = "sspValue4Column";
		this.LabelID1.DataPropertyName = "LabelID1";
		this.LabelID1.DataSource = this.labelBindingSource1;
		this.LabelID1.DisplayMember = "Name";
		resources.ApplyResources(this.LabelID1, "LabelID1");
		this.LabelID1.Name = "LabelID1";
		this.LabelID1.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.LabelID1.ValueMember = "LabelID";
		this.labelBindingSource1.DataMember = "Label";
		this.labelBindingSource1.DataSource = this.eCSDataSet;
		this.labelBindingSource1.Filter = "LabelID >=0 AND LabelID <= 99";
		this.labelBindingSource1.Sort = "LabelID";
		this.BarT1.DataPropertyName = "BarT1";
		this.BarT1.DataSource = this.barcodeBindingSource1;
		this.BarT1.DisplayMember = "Name";
		resources.ApplyResources(this.BarT1, "BarT1");
		this.BarT1.Name = "BarT1";
		this.BarT1.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.BarT1.ValueMember = "BarID";
		this.barcodeBindingSource1.DataMember = "Barcode";
		this.barcodeBindingSource1.DataSource = this.eCSDataSet;
		this.barcodeBindingSource1.Sort = "BarID";
		this.BarF1.DataPropertyName = "BarF1";
		resources.ApplyResources(this.BarF1, "BarF1");
		this.BarF1.Name = "BarF1";
		this.LabelID2.DataPropertyName = "LabelID2";
		this.LabelID2.DataSource = this.labelBindingSource2;
		this.LabelID2.DisplayMember = "Name";
		resources.ApplyResources(this.LabelID2, "LabelID2");
		this.LabelID2.Name = "LabelID2";
		this.LabelID2.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.LabelID2.ValueMember = "LabelID";
		this.labelBindingSource2.DataMember = "Label";
		this.labelBindingSource2.DataSource = this.eCSDataSet;
		this.labelBindingSource2.Filter = "LabelID >=0 AND LabelID <= 99";
		this.labelBindingSource2.Sort = "LabelID";
		this.BarT2.DataPropertyName = "BarT2";
		this.BarT2.DataSource = this.barcodeBindingSource2;
		this.BarT2.DisplayMember = "Name";
		resources.ApplyResources(this.BarT2, "BarT2");
		this.BarT2.Name = "BarT2";
		this.BarT2.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.BarT2.ValueMember = "BarID";
		this.barcodeBindingSource2.DataMember = "Barcode";
		this.barcodeBindingSource2.DataSource = this.eCSDataSet;
		this.barcodeBindingSource2.Sort = "BarID";
		this.BarF2.DataPropertyName = "BarF2";
		resources.ApplyResources(this.BarF2, "BarF2");
		this.BarF2.Name = "BarF2";
		this.Bitmap.DataPropertyName = "Bitmap";
		this.Bitmap.DataSource = this.bitmapBindingSource2;
		this.Bitmap.DisplayMember = "Des";
		resources.ApplyResources(this.Bitmap, "Bitmap");
		this.Bitmap.Name = "Bitmap";
		this.Bitmap.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.Bitmap.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.Bitmap.ValueMember = "ID";
		this.bitmapBindingSource2.AllowNew = false;
		this.bitmapBindingSource2.DataMember = "Bitmap";
		this.bitmapBindingSource2.DataSource = this.eCSDataSet;
		this.Text1.DataPropertyName = "Text1";
		resources.ApplyResources(this.Text1, "Text1");
		this.Text1.Name = "Text1";
		this.Text2.DataPropertyName = "Text2";
		resources.ApplyResources(this.Text2, "Text2");
		this.Text2.Name = "Text2";
		this.Text3.DataPropertyName = "Text3";
		resources.ApplyResources(this.Text3, "Text3");
		this.Text3.Name = "Text3";
		this.Text4.DataPropertyName = "Text4";
		resources.ApplyResources(this.Text4, "Text4");
		this.Text4.Name = "Text4";
		this.Text5.DataPropertyName = "Text5";
		resources.ApplyResources(this.Text5, "Text5");
		this.Text5.Name = "Text5";
		this.Text6.DataPropertyName = "Text6";
		resources.ApplyResources(this.Text6, "Text6");
		this.Text6.Name = "Text6";
		this.Text7.DataPropertyName = "Text7";
		resources.ApplyResources(this.Text7, "Text7");
		this.Text7.Name = "Text7";
		this.pLUBindingSource.DataMember = "PLU";
		this.pLUBindingSource.DataSource = this.eCSDataSet;
		this.pLUBindingSource.Filter = "";
		this.pLUBindingSource.Sort = "";
		this.pLUBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(pLUBindingSource_BindingComplete);
		this.tabControl.Controls.Add(this.basicPage);
		this.tabControl.Controls.Add(this.labelPage);
		this.tabControl.Controls.Add(this.textPage);
		this.tabControl.Controls.Add(this.timePage);
		this.tabControl.Controls.Add(this.discountPage);
		resources.ApplyResources(this.tabControl, "tabControl");
		this.tabControl.Name = "tabControl";
		this.tabControl.SelectedIndex = 0;
		resources.ApplyResources(this.basicPage, "basicPage");
		this.basicPage.Controls.Add(this.Basic_TableLayoutPanel);
		this.basicPage.Name = "basicPage";
		this.basicPage.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Basic_TableLayoutPanel, "Basic_TableLayoutPanel");
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_Unit_Panel, 0, 5);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_Class_Panel, 0, 4);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_Fix1_Panel, 0, 0);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_Measure_Panel, 0, 6);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_Fix3_Panel, 0, 11);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_Tare_Panel, 0, 8);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_TarePencent_Panel, 0, 9);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_FixedWeight_Panel, 0, 10);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_ItemCode_Panel, 0, 2);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_ALPHA_Panel, 0, 1);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_TaxRate_Panel, 0, 13);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_SSP1_Panel, 0, 14);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_SType_Panel, 0, 18);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_TaxType_Panel, 0, 12);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_SSP4_Panel, 0, 17);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_SSP3_Panel, 0, 16);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_SSP2_Panel, 0, 15);
		this.Basic_TableLayoutPanel.Controls.Add(this.TE2_label, 0, 20);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_Index_Panel, 0, 3);
		this.Basic_TableLayoutPanel.Controls.Add(this.Basic_SaveAsWeight_Panel, 0, 7);
		this.Basic_TableLayoutPanel.Name = "Basic_TableLayoutPanel";
		this.Basic_Unit_Panel.Controls.Add(this.unitIDLabel);
		this.Basic_Unit_Panel.Controls.Add(this.unitIDComboBox);
		resources.ApplyResources(this.Basic_Unit_Panel, "Basic_Unit_Panel");
		this.Basic_Unit_Panel.Name = "Basic_Unit_Panel";
		resources.ApplyResources(this.unitIDLabel, "unitIDLabel");
		this.unitIDLabel.Name = "unitIDLabel";
		this.unitIDComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "UnitID", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.unitIDComboBox.DataSource = this.unitBindingSource;
		this.unitIDComboBox.DisplayMember = "Name";
		this.unitIDComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.unitIDComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.unitIDComboBox, "unitIDComboBox");
		this.unitIDComboBox.Name = "unitIDComboBox";
		this.unitIDComboBox.ValueMember = "UnitID";
		this.unitIDComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(unitIDComboBox_Format);
		this.unitIDComboBox.SelectedValueChanged += new System.EventHandler(unitIDComboBox_SelectedValueChanged);
		this.Basic_Class_Panel.Controls.Add(this.classIDLabel);
		this.Basic_Class_Panel.Controls.Add(this.classIDComboBox);
		resources.ApplyResources(this.Basic_Class_Panel, "Basic_Class_Panel");
		this.Basic_Class_Panel.Name = "Basic_Class_Panel";
		resources.ApplyResources(this.classIDLabel, "classIDLabel");
		this.classIDLabel.Name = "classIDLabel";
		this.classIDComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "ClassID", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.classIDComboBox.DataSource = this.classBindingSource;
		this.classIDComboBox.DisplayMember = "Name";
		this.classIDComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.classIDComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.classIDComboBox, "classIDComboBox");
		this.classIDComboBox.Name = "classIDComboBox";
		this.classIDComboBox.ValueMember = "ClassID";
		this.classIDComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(classIDComboBox_Format);
		this.Basic_Fix1_Panel.Controls.Add(this.Debug_Label);
		this.Basic_Fix1_Panel.Controls.Add(this.tareNumericUpDown);
		this.Basic_Fix1_Panel.Controls.Add(this.pLUIDLabel);
		this.Basic_Fix1_Panel.Controls.Add(this.FlagValue_NumericUpDown);
		this.Basic_Fix1_Panel.Controls.Add(this.pLUIDNumericUpDown);
		this.Basic_Fix1_Panel.Controls.Add(this.valid_checkBox);
		this.Basic_Fix1_Panel.Controls.Add(this.Flag_NumericUpDown);
		this.Basic_Fix1_Panel.Controls.Add(this.imEx_Label);
		this.Basic_Fix1_Panel.Controls.Add(this.nameLabel);
		this.Basic_Fix1_Panel.Controls.Add(this.nameTextBox);
		resources.ApplyResources(this.Basic_Fix1_Panel, "Basic_Fix1_Panel");
		this.Basic_Fix1_Panel.Name = "Basic_Fix1_Panel";
		resources.ApplyResources(this.Debug_Label, "Debug_Label");
		this.Debug_Label.ForeColor = System.Drawing.Color.Red;
		this.Debug_Label.Name = "Debug_Label";
		this.tareNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "Tare", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.tareNumericUpDown.DecimalPlaces = 3;
		resources.ApplyResources(this.tareNumericUpDown, "tareNumericUpDown");
		this.tareNumericUpDown.Maximum = new decimal(new int[4] { 9999, 0, 0, 0 });
		this.tareNumericUpDown.Name = "tareNumericUpDown";
		resources.ApplyResources(this.pLUIDLabel, "pLUIDLabel");
		this.pLUIDLabel.Name = "pLUIDLabel";
		this.FlagValue_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "Flag_Value", true));
		resources.ApplyResources(this.FlagValue_NumericUpDown, "FlagValue_NumericUpDown");
		this.FlagValue_NumericUpDown.Name = "FlagValue_NumericUpDown";
		this.pLUIDNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "PLUID", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.pLUIDNumericUpDown, "pLUIDNumericUpDown");
		this.pLUIDNumericUpDown.Maximum = new decimal(new int[4] { 9999999, 0, 0, 0 });
		this.pLUIDNumericUpDown.Name = "pLUIDNumericUpDown";
		resources.ApplyResources(this.valid_checkBox, "valid_checkBox");
		this.valid_checkBox.DataBindings.Add(new System.Windows.Forms.Binding("Checked", this.pLUBindingSource, "Valid", true));
		this.valid_checkBox.Name = "valid_checkBox";
		this.valid_checkBox.UseVisualStyleBackColor = true;
		this.valid_checkBox.Click += new System.EventHandler(valid_checkBox_Click);
		this.Flag_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "Flag", true));
		resources.ApplyResources(this.Flag_NumericUpDown, "Flag_NumericUpDown");
		this.Flag_NumericUpDown.Name = "Flag_NumericUpDown";
		this.Flag_NumericUpDown.ValueChanged += new System.EventHandler(Flag_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.imEx_Label, "imEx_Label");
		this.imEx_Label.Name = "imEx_Label";
		resources.ApplyResources(this.nameLabel, "nameLabel");
		this.nameLabel.Name = "nameLabel";
		this.nameTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.pLUBindingSource, "Name", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.nameTextBox, "nameTextBox");
		this.nameTextBox.Name = "nameTextBox";
		this.nameTextBox.TextChanged += new System.EventHandler(nameTextBox_TextChanged);
		this.nameTextBox.KeyDown += new System.Windows.Forms.KeyEventHandler(nameTextBox_KeyDown);
		this.Basic_Measure_Panel.Controls.Add(this.Measure_CheckBox);
		this.Basic_Measure_Panel.Controls.Add(this.Measure_Pos_TextBox);
		resources.ApplyResources(this.Basic_Measure_Panel, "Basic_Measure_Panel");
		this.Basic_Measure_Panel.Name = "Basic_Measure_Panel";
		resources.ApplyResources(this.Measure_CheckBox, "Measure_CheckBox");
		this.Measure_CheckBox.Name = "Measure_CheckBox";
		this.Measure_CheckBox.UseVisualStyleBackColor = true;
		this.Measure_CheckBox.Click += new System.EventHandler(Measure_CheckBox_Click);
		resources.ApplyResources(this.Measure_Pos_TextBox, "Measure_Pos_TextBox");
		this.Measure_Pos_TextBox.Name = "Measure_Pos_TextBox";
		this.Basic_Fix3_Panel.Controls.Add(this.priceLabel1);
		this.Basic_Fix3_Panel.Controls.Add(this.priceNumericUpDown);
		this.Basic_Fix3_Panel.Controls.Add(this.costNumericUpDown);
		this.Basic_Fix3_Panel.Controls.Add(this.costLabel1);
		resources.ApplyResources(this.Basic_Fix3_Panel, "Basic_Fix3_Panel");
		this.Basic_Fix3_Panel.Name = "Basic_Fix3_Panel";
		resources.ApplyResources(this.priceLabel1, "priceLabel1");
		this.priceLabel1.Name = "priceLabel1";
		this.priceNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "Price", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.priceNumericUpDown.DecimalPlaces = 2;
		resources.ApplyResources(this.priceNumericUpDown, "priceNumericUpDown");
		this.priceNumericUpDown.Maximum = new decimal(new int[4] { 9999999, 0, 0, 0 });
		this.priceNumericUpDown.Name = "priceNumericUpDown";
		this.costNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "Cost", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.costNumericUpDown.DecimalPlaces = 2;
		resources.ApplyResources(this.costNumericUpDown, "costNumericUpDown");
		this.costNumericUpDown.Maximum = new decimal(new int[4] { 9999999, 0, 0, 0 });
		this.costNumericUpDown.Name = "costNumericUpDown";
		resources.ApplyResources(this.costLabel1, "costLabel1");
		this.costLabel1.Name = "costLabel1";
		this.Basic_Tare_Panel.Controls.Add(this.Tare_Pos_NumericUpDown);
		this.Basic_Tare_Panel.Controls.Add(this.tareLabel1);
		resources.ApplyResources(this.Basic_Tare_Panel, "Basic_Tare_Panel");
		this.Basic_Tare_Panel.Name = "Basic_Tare_Panel";
		resources.ApplyResources(this.Tare_Pos_NumericUpDown, "Tare_Pos_NumericUpDown");
		this.Tare_Pos_NumericUpDown.Name = "Tare_Pos_NumericUpDown";
		resources.ApplyResources(this.tareLabel1, "tareLabel1");
		this.tareLabel1.Name = "tareLabel1";
		this.Basic_TarePencent_Panel.Controls.Add(this.TarePencent_Pos_Label);
		this.Basic_TarePencent_Panel.Controls.Add(this.TarePencent_Pos_NumericUpDown);
		this.Basic_TarePencent_Panel.Controls.Add(this.TarePencent_CheckBox);
		resources.ApplyResources(this.Basic_TarePencent_Panel, "Basic_TarePencent_Panel");
		this.Basic_TarePencent_Panel.Name = "Basic_TarePencent_Panel";
		resources.ApplyResources(this.TarePencent_Pos_Label, "TarePencent_Pos_Label");
		this.TarePencent_Pos_Label.Name = "TarePencent_Pos_Label";
		resources.ApplyResources(this.TarePencent_Pos_NumericUpDown, "TarePencent_Pos_NumericUpDown");
		this.TarePencent_Pos_NumericUpDown.Name = "TarePencent_Pos_NumericUpDown";
		resources.ApplyResources(this.TarePencent_CheckBox, "TarePencent_CheckBox");
		this.TarePencent_CheckBox.Name = "TarePencent_CheckBox";
		this.TarePencent_CheckBox.UseVisualStyleBackColor = true;
		this.TarePencent_CheckBox.Click += new System.EventHandler(Flag_Changed);
		this.Basic_FixedWeight_Panel.Controls.Add(this.FixedWeight_Pos_NumericUpDown);
		this.Basic_FixedWeight_Panel.Controls.Add(this.FixedWeight_CheckBox);
		resources.ApplyResources(this.Basic_FixedWeight_Panel, "Basic_FixedWeight_Panel");
		this.Basic_FixedWeight_Panel.Name = "Basic_FixedWeight_Panel";
		resources.ApplyResources(this.FixedWeight_Pos_NumericUpDown, "FixedWeight_Pos_NumericUpDown");
		this.FixedWeight_Pos_NumericUpDown.Name = "FixedWeight_Pos_NumericUpDown";
		resources.ApplyResources(this.FixedWeight_CheckBox, "FixedWeight_CheckBox");
		this.FixedWeight_CheckBox.Name = "FixedWeight_CheckBox";
		this.FixedWeight_CheckBox.UseVisualStyleBackColor = true;
		this.FixedWeight_CheckBox.Click += new System.EventHandler(Flag_Changed);
		this.Basic_ItemCode_Panel.Controls.Add(this.remarkLabel);
		this.Basic_ItemCode_Panel.Controls.Add(this.remarkNumericUpDown);
		resources.ApplyResources(this.Basic_ItemCode_Panel, "Basic_ItemCode_Panel");
		this.Basic_ItemCode_Panel.Name = "Basic_ItemCode_Panel";
		resources.ApplyResources(this.remarkLabel, "remarkLabel");
		this.remarkLabel.Name = "remarkLabel";
		this.remarkNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "Remark", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.remarkNumericUpDown, "remarkNumericUpDown");
		this.remarkNumericUpDown.Maximum = new decimal(new int[4] { 99999999, 0, 0, 0 });
		this.remarkNumericUpDown.Name = "remarkNumericUpDown";
		this.Basic_ALPHA_Panel.Controls.Add(this.alpha_label);
		this.Basic_ALPHA_Panel.Controls.Add(this.Alpha_TextBox);
		resources.ApplyResources(this.Basic_ALPHA_Panel, "Basic_ALPHA_Panel");
		this.Basic_ALPHA_Panel.Name = "Basic_ALPHA_Panel";
		resources.ApplyResources(this.alpha_label, "alpha_label");
		this.alpha_label.Name = "alpha_label";
		this.Alpha_TextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.pLUBindingSource, "ALPHA", true));
		resources.ApplyResources(this.Alpha_TextBox, "Alpha_TextBox");
		this.Alpha_TextBox.Name = "Alpha_TextBox";
		this.Basic_TaxRate_Panel.Controls.Add(this.taxLabel);
		this.Basic_TaxRate_Panel.Controls.Add(this.taxTextBox);
		resources.ApplyResources(this.Basic_TaxRate_Panel, "Basic_TaxRate_Panel");
		this.Basic_TaxRate_Panel.Name = "Basic_TaxRate_Panel";
		resources.ApplyResources(this.taxLabel, "taxLabel");
		this.taxLabel.Name = "taxLabel";
		this.taxTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.pLUBindingSource, "Tax", true));
		resources.ApplyResources(this.taxTextBox, "taxTextBox");
		this.taxTextBox.Name = "taxTextBox";
		this.Basic_SSP1_Panel.Controls.Add(this.sspValue1Label);
		this.Basic_SSP1_Panel.Controls.Add(this.sspComboBox1);
		this.Basic_SSP1_Panel.Controls.Add(this.sspValue1NumericUpDown);
		resources.ApplyResources(this.Basic_SSP1_Panel, "Basic_SSP1_Panel");
		this.Basic_SSP1_Panel.Name = "Basic_SSP1_Panel";
		resources.ApplyResources(this.sspValue1Label, "sspValue1Label");
		this.sspValue1Label.Name = "sspValue1Label";
		this.sspComboBox1.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.sspComboBox1.FormattingEnabled = true;
		resources.ApplyResources(this.sspComboBox1, "sspComboBox1");
		this.sspComboBox1.Name = "sspComboBox1";
		this.sspComboBox1.Format += new System.Windows.Forms.ListControlConvertEventHandler(sspComboBox_Format);
		this.sspValue1NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "SspValue1", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.sspValue1NumericUpDown, "sspValue1NumericUpDown");
		this.sspValue1NumericUpDown.Maximum = new decimal(new int[4] { 10000, 0, 0, 0 });
		this.sspValue1NumericUpDown.Name = "sspValue1NumericUpDown";
		this.Basic_SType_Panel.Controls.Add(this.SType_Label);
		this.Basic_SType_Panel.Controls.Add(this.SType_ComboBox);
		resources.ApplyResources(this.Basic_SType_Panel, "Basic_SType_Panel");
		this.Basic_SType_Panel.Name = "Basic_SType_Panel";
		resources.ApplyResources(this.SType_Label, "SType_Label");
		this.SType_Label.Name = "SType_Label";
		this.SType_ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "SType", true));
		this.SType_ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.SType_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.SType_ComboBox, "SType_ComboBox");
		this.SType_ComboBox.Name = "SType_ComboBox";
		this.SType_ComboBox.SelectedIndexChanged += new System.EventHandler(SType_ComboBox_SelectedIndexChanged);
		this.Basic_TaxType_Panel.Controls.Add(this.taxTypeLabel);
		this.Basic_TaxType_Panel.Controls.Add(this.taxTypeComboBox);
		resources.ApplyResources(this.Basic_TaxType_Panel, "Basic_TaxType_Panel");
		this.Basic_TaxType_Panel.Name = "Basic_TaxType_Panel";
		resources.ApplyResources(this.taxTypeLabel, "taxTypeLabel");
		this.taxTypeLabel.Name = "taxTypeLabel";
		this.taxTypeComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "TaxType", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.taxTypeComboBox.DataSource = this.pLU_TaxTypeBindingSource;
		this.taxTypeComboBox.DisplayMember = "Display";
		this.taxTypeComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.taxTypeComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.taxTypeComboBox, "taxTypeComboBox");
		this.taxTypeComboBox.Name = "taxTypeComboBox";
		this.taxTypeComboBox.ValueMember = "Value";
		this.taxTypeComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(pLUComboBox_Format);
		this.taxTypeComboBox.SelectedValueChanged += new System.EventHandler(taxTypeComboBox_SelectedValueChanged);
		this.Basic_SSP4_Panel.Controls.Add(this.sspValue4Label);
		this.Basic_SSP4_Panel.Controls.Add(this.sspValue4NumericUpDown);
		this.Basic_SSP4_Panel.Controls.Add(this.sspComboBox4);
		resources.ApplyResources(this.Basic_SSP4_Panel, "Basic_SSP4_Panel");
		this.Basic_SSP4_Panel.Name = "Basic_SSP4_Panel";
		resources.ApplyResources(this.sspValue4Label, "sspValue4Label");
		this.sspValue4Label.Name = "sspValue4Label";
		this.sspValue4NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "SspValue4", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.sspValue4NumericUpDown, "sspValue4NumericUpDown");
		this.sspValue4NumericUpDown.Maximum = new decimal(new int[4] { 10000, 0, 0, 0 });
		this.sspValue4NumericUpDown.Name = "sspValue4NumericUpDown";
		this.sspComboBox4.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.sspComboBox4.FormattingEnabled = true;
		resources.ApplyResources(this.sspComboBox4, "sspComboBox4");
		this.sspComboBox4.Name = "sspComboBox4";
		this.sspComboBox4.Format += new System.Windows.Forms.ListControlConvertEventHandler(sspComboBox_Format);
		this.Basic_SSP3_Panel.Controls.Add(this.sspValue3Label);
		this.Basic_SSP3_Panel.Controls.Add(this.sspComboBox3);
		this.Basic_SSP3_Panel.Controls.Add(this.sspValue3NumericUpDown);
		resources.ApplyResources(this.Basic_SSP3_Panel, "Basic_SSP3_Panel");
		this.Basic_SSP3_Panel.Name = "Basic_SSP3_Panel";
		resources.ApplyResources(this.sspValue3Label, "sspValue3Label");
		this.sspValue3Label.Name = "sspValue3Label";
		this.sspComboBox3.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.sspComboBox3.FormattingEnabled = true;
		resources.ApplyResources(this.sspComboBox3, "sspComboBox3");
		this.sspComboBox3.Name = "sspComboBox3";
		this.sspComboBox3.Format += new System.Windows.Forms.ListControlConvertEventHandler(sspComboBox_Format);
		this.sspValue3NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "SspValue3", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.sspValue3NumericUpDown, "sspValue3NumericUpDown");
		this.sspValue3NumericUpDown.Maximum = new decimal(new int[4] { 10000, 0, 0, 0 });
		this.sspValue3NumericUpDown.Name = "sspValue3NumericUpDown";
		this.Basic_SSP2_Panel.Controls.Add(this.sspComboBox2);
		this.Basic_SSP2_Panel.Controls.Add(this.sspValue2Label);
		this.Basic_SSP2_Panel.Controls.Add(this.sspValue2NumericUpDown);
		resources.ApplyResources(this.Basic_SSP2_Panel, "Basic_SSP2_Panel");
		this.Basic_SSP2_Panel.Name = "Basic_SSP2_Panel";
		this.sspComboBox2.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.sspComboBox2.FormattingEnabled = true;
		resources.ApplyResources(this.sspComboBox2, "sspComboBox2");
		this.sspComboBox2.Name = "sspComboBox2";
		this.sspComboBox2.Format += new System.Windows.Forms.ListControlConvertEventHandler(sspComboBox_Format);
		resources.ApplyResources(this.sspValue2Label, "sspValue2Label");
		this.sspValue2Label.Name = "sspValue2Label";
		this.sspValue2NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "SspValue2", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.sspValue2NumericUpDown, "sspValue2NumericUpDown");
		this.sspValue2NumericUpDown.Maximum = new decimal(new int[4] { 10000, 0, 0, 0 });
		this.sspValue2NumericUpDown.Name = "sspValue2NumericUpDown";
		resources.ApplyResources(this.TE2_label, "TE2_label");
		this.TE2_label.Name = "TE2_label";
		this.Basic_Index_Panel.Controls.Add(this.indexLabel);
		this.Basic_Index_Panel.Controls.Add(this.indexTextBox);
		resources.ApplyResources(this.Basic_Index_Panel, "Basic_Index_Panel");
		this.Basic_Index_Panel.Name = "Basic_Index_Panel";
		resources.ApplyResources(this.indexLabel, "indexLabel");
		this.indexLabel.Name = "indexLabel";
		this.indexTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.pLUBindingSource, "Index", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.indexTextBox, "indexTextBox");
		this.indexTextBox.Name = "indexTextBox";
		this.Basic_SaveAsWeight_Panel.Controls.Add(this.SaveAsWeight_CheckBox);
		resources.ApplyResources(this.Basic_SaveAsWeight_Panel, "Basic_SaveAsWeight_Panel");
		this.Basic_SaveAsWeight_Panel.Name = "Basic_SaveAsWeight_Panel";
		resources.ApplyResources(this.SaveAsWeight_CheckBox, "SaveAsWeight_CheckBox");
		this.SaveAsWeight_CheckBox.Name = "SaveAsWeight_CheckBox";
		this.SaveAsWeight_CheckBox.UseVisualStyleBackColor = true;
		this.SaveAsWeight_CheckBox.Click += new System.EventHandler(Measure_CheckBox_Click);
		resources.ApplyResources(this.labelPage, "labelPage");
		this.labelPage.Controls.Add(this.Print_TableLayoutPanel);
		this.labelPage.Name = "labelPage";
		this.labelPage.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Print_TableLayoutPanel, "Print_TableLayoutPanel");
		this.Print_TableLayoutPanel.Controls.Add(this.Print_Bill1_Panel, 0, 0);
		this.Print_TableLayoutPanel.Controls.Add(this.Print_Bill2_Panel, 0, 1);
		this.Print_TableLayoutPanel.Controls.Add(this.Print_Bitmap_Panel, 0, 2);
		this.Print_TableLayoutPanel.Name = "Print_TableLayoutPanel";
		this.Print_Bill1_Panel.Controls.Add(this.labelID1ComboBox);
		this.Print_Bill1_Panel.Controls.Add(this.barT1ComboBox);
		this.Print_Bill1_Panel.Controls.Add(this.barF1NumericUpDown);
		this.Print_Bill1_Panel.Controls.Add(this.labelID1Label);
		this.Print_Bill1_Panel.Controls.Add(this.barF1Label1);
		this.Print_Bill1_Panel.Controls.Add(this.barT1Label1);
		resources.ApplyResources(this.Print_Bill1_Panel, "Print_Bill1_Panel");
		this.Print_Bill1_Panel.Name = "Print_Bill1_Panel";
		this.labelID1ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "LabelID1", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.labelID1ComboBox.DataSource = this.labelBindingSource1;
		this.labelID1ComboBox.DisplayMember = "Name";
		this.labelID1ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.labelID1ComboBox.DropDownWidth = 200;
		this.labelID1ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.labelID1ComboBox, "labelID1ComboBox");
		this.labelID1ComboBox.Name = "labelID1ComboBox";
		this.labelID1ComboBox.ValueMember = "LabelID";
		this.labelID1ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(labelComboBox_Format);
		this.barT1ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "BarT1", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.barT1ComboBox.DataSource = this.barcodeBindingSource1;
		this.barT1ComboBox.DisplayMember = "Name";
		this.barT1ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.barT1ComboBox.DropDownWidth = 200;
		this.barT1ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.barT1ComboBox, "barT1ComboBox");
		this.barT1ComboBox.Name = "barT1ComboBox";
		this.barT1ComboBox.ValueMember = "BarID";
		this.barT1ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(barcodeComboBox_Format);
		this.barF1NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "BarF1", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.barF1NumericUpDown, "barF1NumericUpDown");
		this.barF1NumericUpDown.Maximum = new decimal(new int[4] { 9999, 0, 0, 0 });
		this.barF1NumericUpDown.Name = "barF1NumericUpDown";
		resources.ApplyResources(this.labelID1Label, "labelID1Label");
		this.labelID1Label.Name = "labelID1Label";
		resources.ApplyResources(this.barF1Label1, "barF1Label1");
		this.barF1Label1.Name = "barF1Label1";
		resources.ApplyResources(this.barT1Label1, "barT1Label1");
		this.barT1Label1.Name = "barT1Label1";
		this.Print_Bill2_Panel.Controls.Add(this.labelID2ComboBox);
		this.Print_Bill2_Panel.Controls.Add(this.barF2Label1);
		this.Print_Bill2_Panel.Controls.Add(this.barT2Label1);
		this.Print_Bill2_Panel.Controls.Add(this.barT2ComboBox);
		this.Print_Bill2_Panel.Controls.Add(this.barF2NumericUpDown);
		this.Print_Bill2_Panel.Controls.Add(this.labelID2Label);
		resources.ApplyResources(this.Print_Bill2_Panel, "Print_Bill2_Panel");
		this.Print_Bill2_Panel.Name = "Print_Bill2_Panel";
		this.labelID2ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "LabelID2", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.labelID2ComboBox.DataSource = this.labelBindingSource2;
		this.labelID2ComboBox.DisplayMember = "Name";
		this.labelID2ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.labelID2ComboBox.DropDownWidth = 200;
		this.labelID2ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.labelID2ComboBox, "labelID2ComboBox");
		this.labelID2ComboBox.Name = "labelID2ComboBox";
		this.labelID2ComboBox.ValueMember = "LabelID";
		this.labelID2ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(labelComboBox_Format);
		resources.ApplyResources(this.barF2Label1, "barF2Label1");
		this.barF2Label1.Name = "barF2Label1";
		resources.ApplyResources(this.barT2Label1, "barT2Label1");
		this.barT2Label1.Name = "barT2Label1";
		this.barT2ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "BarT2", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.barT2ComboBox.DataSource = this.barcodeBindingSource2;
		this.barT2ComboBox.DisplayMember = "Name";
		this.barT2ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.barT2ComboBox.DropDownWidth = 200;
		this.barT2ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.barT2ComboBox, "barT2ComboBox");
		this.barT2ComboBox.Name = "barT2ComboBox";
		this.barT2ComboBox.ValueMember = "BarID";
		this.barT2ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(barcodeComboBox_Format);
		this.barF2NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "BarF2", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.barF2NumericUpDown, "barF2NumericUpDown");
		this.barF2NumericUpDown.Maximum = new decimal(new int[4] { 9999, 0, 0, 0 });
		this.barF2NumericUpDown.Name = "barF2NumericUpDown";
		resources.ApplyResources(this.labelID2Label, "labelID2Label");
		this.labelID2Label.Name = "labelID2Label";
		this.Print_Bitmap_Panel.Controls.Add(this.Bitmap_ComboBox);
		this.Print_Bitmap_Panel.Controls.Add(this.bitmapLabel);
		resources.ApplyResources(this.Print_Bitmap_Panel, "Print_Bitmap_Panel");
		this.Print_Bitmap_Panel.Name = "Print_Bitmap_Panel";
		this.Bitmap_ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "Bitmap", true));
		this.Bitmap_ComboBox.DataSource = this.bitmapBindingSource;
		this.Bitmap_ComboBox.DisplayMember = "Des";
		this.Bitmap_ComboBox.DropDownWidth = 200;
		this.Bitmap_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.Bitmap_ComboBox, "Bitmap_ComboBox");
		this.Bitmap_ComboBox.Name = "Bitmap_ComboBox";
		this.Bitmap_ComboBox.ValueMember = "ID";
		this.bitmapBindingSource.AllowNew = false;
		this.bitmapBindingSource.DataMember = "Bitmap";
		this.bitmapBindingSource.DataSource = this.eCSDataSet;
		resources.ApplyResources(this.bitmapLabel, "bitmapLabel");
		this.bitmapLabel.Name = "bitmapLabel";
		this.textPage.Controls.Add(this.Text_TableLayoutPanel);
		resources.ApplyResources(this.textPage, "textPage");
		this.textPage.Name = "textPage";
		this.textPage.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Text_TableLayoutPanel, "Text_TableLayoutPanel");
		this.Text_TableLayoutPanel.Controls.Add(this.Text_1_Panel, 0, 0);
		this.Text_TableLayoutPanel.Controls.Add(this.Text_2_Panel, 0, 1);
		this.Text_TableLayoutPanel.Controls.Add(this.Text_3_Panel, 0, 2);
		this.Text_TableLayoutPanel.Controls.Add(this.Text_4_Panel, 0, 3);
		this.Text_TableLayoutPanel.Controls.Add(this.Text_5_Panel, 0, 4);
		this.Text_TableLayoutPanel.Controls.Add(this.Text_6_Panel, 0, 5);
		this.Text_TableLayoutPanel.Controls.Add(this.Text_7_Panel, 0, 6);
		this.Text_TableLayoutPanel.Name = "Text_TableLayoutPanel";
		this.Text_1_Panel.Controls.Add(this.text1TextBox);
		this.Text_1_Panel.Controls.Add(this.text1Label);
		resources.ApplyResources(this.Text_1_Panel, "Text_1_Panel");
		this.Text_1_Panel.Name = "Text_1_Panel";
		this.text1TextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.pLUBindingSource, "Text1", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.text1TextBox, "text1TextBox");
		this.text1TextBox.Name = "text1TextBox";
		this.text1TextBox.KeyDown += new System.Windows.Forms.KeyEventHandler(nameTextBox_KeyDown);
		resources.ApplyResources(this.text1Label, "text1Label");
		this.text1Label.Name = "text1Label";
		this.Text_2_Panel.Controls.Add(this.text2TextBox);
		this.Text_2_Panel.Controls.Add(this.text2Label);
		resources.ApplyResources(this.Text_2_Panel, "Text_2_Panel");
		this.Text_2_Panel.Name = "Text_2_Panel";
		this.text2TextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.pLUBindingSource, "Text2", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.text2TextBox, "text2TextBox");
		this.text2TextBox.Name = "text2TextBox";
		this.text2TextBox.KeyDown += new System.Windows.Forms.KeyEventHandler(nameTextBox_KeyDown);
		resources.ApplyResources(this.text2Label, "text2Label");
		this.text2Label.Name = "text2Label";
		this.Text_3_Panel.Controls.Add(this.text3TextBox);
		this.Text_3_Panel.Controls.Add(this.text3Label);
		resources.ApplyResources(this.Text_3_Panel, "Text_3_Panel");
		this.Text_3_Panel.Name = "Text_3_Panel";
		this.text3TextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.pLUBindingSource, "Text3", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.text3TextBox, "text3TextBox");
		this.text3TextBox.Name = "text3TextBox";
		this.text3TextBox.KeyDown += new System.Windows.Forms.KeyEventHandler(nameTextBox_KeyDown);
		resources.ApplyResources(this.text3Label, "text3Label");
		this.text3Label.Name = "text3Label";
		this.Text_4_Panel.Controls.Add(this.text4TextBox);
		this.Text_4_Panel.Controls.Add(this.text4Label);
		resources.ApplyResources(this.Text_4_Panel, "Text_4_Panel");
		this.Text_4_Panel.Name = "Text_4_Panel";
		this.text4TextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.pLUBindingSource, "Text4", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.text4TextBox, "text4TextBox");
		this.text4TextBox.Name = "text4TextBox";
		this.text4TextBox.KeyDown += new System.Windows.Forms.KeyEventHandler(nameTextBox_KeyDown);
		resources.ApplyResources(this.text4Label, "text4Label");
		this.text4Label.Name = "text4Label";
		this.Text_5_Panel.Controls.Add(this.text5TextBox);
		this.Text_5_Panel.Controls.Add(this.text5Label);
		resources.ApplyResources(this.Text_5_Panel, "Text_5_Panel");
		this.Text_5_Panel.Name = "Text_5_Panel";
		this.text5TextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.pLUBindingSource, "Text5", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.text5TextBox, "text5TextBox");
		this.text5TextBox.Name = "text5TextBox";
		this.text5TextBox.KeyDown += new System.Windows.Forms.KeyEventHandler(nameTextBox_KeyDown);
		resources.ApplyResources(this.text5Label, "text5Label");
		this.text5Label.Name = "text5Label";
		this.Text_6_Panel.Controls.Add(this.text6TextBox);
		this.Text_6_Panel.Controls.Add(this.text6Label);
		resources.ApplyResources(this.Text_6_Panel, "Text_6_Panel");
		this.Text_6_Panel.Name = "Text_6_Panel";
		this.text6TextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.pLUBindingSource, "Text6", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.text6TextBox, "text6TextBox");
		this.text6TextBox.Name = "text6TextBox";
		this.text6TextBox.KeyDown += new System.Windows.Forms.KeyEventHandler(nameTextBox_KeyDown);
		resources.ApplyResources(this.text6Label, "text6Label");
		this.text6Label.Name = "text6Label";
		this.Text_7_Panel.Controls.Add(this.text7_Pos_TextBox);
		this.Text_7_Panel.Controls.Add(this.text7TextBox);
		this.Text_7_Panel.Controls.Add(this.text7Label);
		resources.ApplyResources(this.Text_7_Panel, "Text_7_Panel");
		this.Text_7_Panel.Name = "Text_7_Panel";
		resources.ApplyResources(this.text7_Pos_TextBox, "text7_Pos_TextBox");
		this.text7_Pos_TextBox.Name = "text7_Pos_TextBox";
		this.text7_Pos_TextBox.KeyDown += new System.Windows.Forms.KeyEventHandler(nameTextBox_KeyDown);
		this.text7TextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.pLUBindingSource, "Text7", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.text7TextBox, "text7TextBox");
		this.text7TextBox.Name = "text7TextBox";
		resources.ApplyResources(this.text7Label, "text7Label");
		this.text7Label.Name = "text7Label";
		resources.ApplyResources(this.timePage, "timePage");
		this.timePage.Controls.Add(this.tableLayoutPanel2);
		this.timePage.Name = "timePage";
		this.timePage.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.tableLayoutPanel2, "tableLayoutPanel2");
		this.tableLayoutPanel2.Controls.Add(this.Time_TimeSD_1_Panel, 0, 0);
		this.tableLayoutPanel2.Controls.Add(this.Time_TimeST_1_Panel, 0, 1);
		this.tableLayoutPanel2.Controls.Add(this.Time_TimePD_1_Panel, 0, 2);
		this.tableLayoutPanel2.Controls.Add(this.Time_TimePT_1_Panel, 0, 3);
		this.tableLayoutPanel2.Controls.Add(this.Time_TimeUD_1_Panel, 0, 4);
		this.tableLayoutPanel2.Controls.Add(this.Time_TimeSD_2_Panel, 0, 5);
		this.tableLayoutPanel2.Controls.Add(this.Time_TimeST_2_Panel, 0, 6);
		this.tableLayoutPanel2.Controls.Add(this.Time_TimePD_2_Panel, 0, 7);
		this.tableLayoutPanel2.Controls.Add(this.Time_TimePT_2_Panel, 0, 8);
		this.tableLayoutPanel2.Controls.Add(this.Time_TimeUD_2_Panel, 0, 9);
		this.tableLayoutPanel2.Name = "tableLayoutPanel2";
		this.Time_TimeSD_1_Panel.Controls.Add(this.pS_SDLabel);
		this.Time_TimeSD_1_Panel.Controls.Add(this.pS_SDComboBox);
		resources.ApplyResources(this.Time_TimeSD_1_Panel, "Time_TimeSD_1_Panel");
		this.Time_TimeSD_1_Panel.Name = "Time_TimeSD_1_Panel";
		resources.ApplyResources(this.pS_SDLabel, "pS_SDLabel");
		this.pS_SDLabel.Name = "pS_SDLabel";
		this.pS_SDComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "PS_SD", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.pS_SDComboBox.DataSource = this.pLUPSDateBindingSource1;
		this.pS_SDComboBox.DisplayMember = "Display";
		this.pS_SDComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.pS_SDComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.pS_SDComboBox, "pS_SDComboBox");
		this.pS_SDComboBox.Name = "pS_SDComboBox";
		this.pS_SDComboBox.ValueMember = "Value";
		this.pS_SDComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(pLUComboBox_Format);
		this.pLUPSDateBindingSource1.DataMember = "PLU_PS_Date";
		this.pLUPSDateBindingSource1.DataSource = this.uiDataSet;
		this.pLUPSDateBindingSource1.Sort = "Value";
		this.Time_TimeST_1_Panel.Controls.Add(this.pS_STLabel);
		this.Time_TimeST_1_Panel.Controls.Add(this.pS_STComboBox);
		resources.ApplyResources(this.Time_TimeST_1_Panel, "Time_TimeST_1_Panel");
		this.Time_TimeST_1_Panel.Name = "Time_TimeST_1_Panel";
		resources.ApplyResources(this.pS_STLabel, "pS_STLabel");
		this.pS_STLabel.Name = "pS_STLabel";
		this.pS_STComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "PS_ST", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.pS_STComboBox.DataSource = this.pLUPSTimeBindingSource1;
		this.pS_STComboBox.DisplayMember = "Display";
		this.pS_STComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.pS_STComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.pS_STComboBox, "pS_STComboBox");
		this.pS_STComboBox.Name = "pS_STComboBox";
		this.pS_STComboBox.ValueMember = "Value";
		this.pS_STComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(pLUComboBox_Format);
		this.pLUPSTimeBindingSource1.DataMember = "PLU_PS_Time";
		this.pLUPSTimeBindingSource1.DataSource = this.uiDataSet;
		this.pLUPSTimeBindingSource1.Sort = "Value";
		this.Time_TimePD_1_Panel.Controls.Add(this.pS_PDLabel);
		this.Time_TimePD_1_Panel.Controls.Add(this.pS_PDComboBox);
		resources.ApplyResources(this.Time_TimePD_1_Panel, "Time_TimePD_1_Panel");
		this.Time_TimePD_1_Panel.Name = "Time_TimePD_1_Panel";
		resources.ApplyResources(this.pS_PDLabel, "pS_PDLabel");
		this.pS_PDLabel.Name = "pS_PDLabel";
		this.pS_PDComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "PS_PD", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.pS_PDComboBox.DataSource = this.pLUPSDateBindingSource2;
		this.pS_PDComboBox.DisplayMember = "Display";
		this.pS_PDComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.pS_PDComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.pS_PDComboBox, "pS_PDComboBox");
		this.pS_PDComboBox.Name = "pS_PDComboBox";
		this.pS_PDComboBox.ValueMember = "Value";
		this.pS_PDComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(pLUComboBox_Format);
		this.pLUPSDateBindingSource2.DataMember = "PLU_PS_Date";
		this.pLUPSDateBindingSource2.DataSource = this.uiDataSet;
		this.pLUPSDateBindingSource2.Sort = "Value";
		this.Time_TimePT_1_Panel.Controls.Add(this.pS_PTLabel);
		this.Time_TimePT_1_Panel.Controls.Add(this.pS_PTComboBox);
		resources.ApplyResources(this.Time_TimePT_1_Panel, "Time_TimePT_1_Panel");
		this.Time_TimePT_1_Panel.Name = "Time_TimePT_1_Panel";
		resources.ApplyResources(this.pS_PTLabel, "pS_PTLabel");
		this.pS_PTLabel.Name = "pS_PTLabel";
		this.pS_PTComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "PS_PT", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.pS_PTComboBox.DataSource = this.pLUPSTimeBindingSource2;
		this.pS_PTComboBox.DisplayMember = "Display";
		this.pS_PTComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.pS_PTComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.pS_PTComboBox, "pS_PTComboBox");
		this.pS_PTComboBox.Name = "pS_PTComboBox";
		this.pS_PTComboBox.ValueMember = "Value";
		this.pS_PTComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(pLUComboBox_Format);
		this.pLUPSTimeBindingSource2.DataMember = "PLU_PS_Time";
		this.pLUPSTimeBindingSource2.DataSource = this.uiDataSet;
		this.pLUPSTimeBindingSource2.Sort = "Value";
		this.Time_TimeUD_1_Panel.Controls.Add(this.pS_UDLabel);
		this.Time_TimeUD_1_Panel.Controls.Add(this.pS_UDComboBox);
		resources.ApplyResources(this.Time_TimeUD_1_Panel, "Time_TimeUD_1_Panel");
		this.Time_TimeUD_1_Panel.Name = "Time_TimeUD_1_Panel";
		resources.ApplyResources(this.pS_UDLabel, "pS_UDLabel");
		this.pS_UDLabel.Name = "pS_UDLabel";
		this.pS_UDComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "PS_UD", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.pS_UDComboBox.DataSource = this.pLUPSDateBindingSource3;
		this.pS_UDComboBox.DisplayMember = "Display";
		this.pS_UDComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.pS_UDComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.pS_UDComboBox, "pS_UDComboBox");
		this.pS_UDComboBox.Name = "pS_UDComboBox";
		this.pS_UDComboBox.ValueMember = "Value";
		this.pS_UDComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(pLUComboBox_Format);
		this.pLUPSDateBindingSource3.DataMember = "PLU_PS_Date";
		this.pLUPSDateBindingSource3.DataSource = this.uiDataSet;
		this.pLUPSDateBindingSource3.Sort = "Value";
		this.Time_TimeSD_2_Panel.Controls.Add(this.pC_SDLabel);
		this.Time_TimeSD_2_Panel.Controls.Add(this.pC_SDNumericUpDown);
		resources.ApplyResources(this.Time_TimeSD_2_Panel, "Time_TimeSD_2_Panel");
		this.Time_TimeSD_2_Panel.Name = "Time_TimeSD_2_Panel";
		resources.ApplyResources(this.pC_SDLabel, "pC_SDLabel");
		this.pC_SDLabel.Name = "pC_SDLabel";
		this.pC_SDNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "PC_SD", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.pC_SDNumericUpDown, "pC_SDNumericUpDown");
		this.pC_SDNumericUpDown.Maximum = new decimal(new int[4] { 999, 0, 0, 0 });
		this.pC_SDNumericUpDown.Name = "pC_SDNumericUpDown";
		this.Time_TimeST_2_Panel.Controls.Add(this.pC_STLabel);
		this.Time_TimeST_2_Panel.Controls.Add(this.pC_ST_HNumericUpDown);
		resources.ApplyResources(this.Time_TimeST_2_Panel, "Time_TimeST_2_Panel");
		this.Time_TimeST_2_Panel.Name = "Time_TimeST_2_Panel";
		resources.ApplyResources(this.pC_STLabel, "pC_STLabel");
		this.pC_STLabel.Name = "pC_STLabel";
		this.pC_ST_HNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "PC_ST", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.pC_ST_HNumericUpDown, "pC_ST_HNumericUpDown");
		this.pC_ST_HNumericUpDown.Maximum = new decimal(new int[4] { 2359, 0, 0, 0 });
		this.pC_ST_HNumericUpDown.Name = "pC_ST_HNumericUpDown";
		this.Time_TimePD_2_Panel.Controls.Add(this.pC_PDLabel);
		this.Time_TimePD_2_Panel.Controls.Add(this.pC_PDNumericUpDown);
		resources.ApplyResources(this.Time_TimePD_2_Panel, "Time_TimePD_2_Panel");
		this.Time_TimePD_2_Panel.Name = "Time_TimePD_2_Panel";
		resources.ApplyResources(this.pC_PDLabel, "pC_PDLabel");
		this.pC_PDLabel.Name = "pC_PDLabel";
		this.pC_PDNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "PC_PD", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.pC_PDNumericUpDown, "pC_PDNumericUpDown");
		this.pC_PDNumericUpDown.Maximum = new decimal(new int[4] { 999, 0, 0, 0 });
		this.pC_PDNumericUpDown.Name = "pC_PDNumericUpDown";
		this.Time_TimePT_2_Panel.Controls.Add(this.pC_PTLabel);
		this.Time_TimePT_2_Panel.Controls.Add(this.pC_PT_HNumericUpDown);
		resources.ApplyResources(this.Time_TimePT_2_Panel, "Time_TimePT_2_Panel");
		this.Time_TimePT_2_Panel.Name = "Time_TimePT_2_Panel";
		resources.ApplyResources(this.pC_PTLabel, "pC_PTLabel");
		this.pC_PTLabel.Name = "pC_PTLabel";
		this.pC_PT_HNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "PC_PT", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.pC_PT_HNumericUpDown, "pC_PT_HNumericUpDown");
		this.pC_PT_HNumericUpDown.Maximum = new decimal(new int[4] { 2359, 0, 0, 0 });
		this.pC_PT_HNumericUpDown.Name = "pC_PT_HNumericUpDown";
		this.Time_TimeUD_2_Panel.Controls.Add(this.pC_UDLabel);
		this.Time_TimeUD_2_Panel.Controls.Add(this.pC_UDNumericUpDown);
		resources.ApplyResources(this.Time_TimeUD_2_Panel, "Time_TimeUD_2_Panel");
		this.Time_TimeUD_2_Panel.Name = "Time_TimeUD_2_Panel";
		resources.ApplyResources(this.pC_UDLabel, "pC_UDLabel");
		this.pC_UDLabel.Name = "pC_UDLabel";
		this.pC_UDNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "PC_UD", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.pC_UDNumericUpDown, "pC_UDNumericUpDown");
		this.pC_UDNumericUpDown.Maximum = new decimal(new int[4] { 999, 0, 0, 0 });
		this.pC_UDNumericUpDown.Name = "pC_UDNumericUpDown";
		resources.ApplyResources(this.discountPage, "discountPage");
		this.discountPage.Controls.Add(this.tableLayoutPanel1);
		this.discountPage.Controls.Add(this.label1);
		this.discountPage.Controls.Add(this.dF_ULabel);
		this.discountPage.Controls.Add(this.dF_UComboBox);
		this.discountPage.Controls.Add(this.dF_DLabel);
		this.discountPage.Controls.Add(this.dF_DComboBox);
		this.discountPage.Controls.Add(this.dF_UNNumericUpDown);
		this.discountPage.Controls.Add(this.dF_DNNumericUpDown);
		this.discountPage.Name = "discountPage";
		this.discountPage.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.tableLayoutPanel1, "tableLayoutPanel1");
		this.tableLayoutPanel1.Controls.Add(this.TE_label, 0, 10);
		this.tableLayoutPanel1.Controls.Add(this.AD4_Data_Panel, 0, 8);
		this.tableLayoutPanel1.Controls.Add(this.AD4_Sort_Panel, 0, 7);
		this.tableLayoutPanel1.Controls.Add(this.AD3_Data_Panel, 0, 6);
		this.tableLayoutPanel1.Controls.Add(this.AD3_Sort_Panel, 0, 5);
		this.tableLayoutPanel1.Controls.Add(this.AD2_Sort_Panel, 0, 3);
		this.tableLayoutPanel1.Controls.Add(this.AD1_Sort_Panel, 0, 1);
		this.tableLayoutPanel1.Controls.Add(this.AD1_Data_Panel, 0, 2);
		this.tableLayoutPanel1.Controls.Add(this.InfoPanel, 0, 0);
		this.tableLayoutPanel1.Controls.Add(this.AD2_Data_Panel, 0, 4);
		this.tableLayoutPanel1.Name = "tableLayoutPanel1";
		resources.ApplyResources(this.TE_label, "TE_label");
		this.TE_label.Name = "TE_label";
		this.AD4_Data_Panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.AD4_Data_Panel.Controls.Add(this.AD4_Day_NumericUpDown);
		this.AD4_Data_Panel.Controls.Add(this.AD4_L1_Label);
		this.AD4_Data_Panel.Controls.Add(this.AD4_Data_1_RadioButton);
		this.AD4_Data_Panel.Controls.Add(this.AD4_Data_0_RadioButton);
		this.AD4_Data_Panel.Controls.Add(this.AD4_Day0_CheckBox);
		this.AD4_Data_Panel.Controls.Add(this.AD4_L0_Label);
		this.AD4_Data_Panel.Controls.Add(this.AD4_Day6_CheckBox);
		this.AD4_Data_Panel.Controls.Add(this.AD4_Day5_CheckBox);
		this.AD4_Data_Panel.Controls.Add(this.AD4_Day4_CheckBox);
		this.AD4_Data_Panel.Controls.Add(this.AD4_VF_High_NumericUpDown);
		this.AD4_Data_Panel.Controls.Add(this.AD4_EnableDays_Label);
		this.AD4_Data_Panel.Controls.Add(this.AD4_ValueField_Label);
		this.AD4_Data_Panel.Controls.Add(this.AD4_Day3_CheckBox);
		this.AD4_Data_Panel.Controls.Add(this.AD4_VF_Low_NumericUpDown);
		this.AD4_Data_Panel.Controls.Add(this.AD4_Day2_CheckBox);
		this.AD4_Data_Panel.Controls.Add(this.AD4_DiscountTo_Label);
		this.AD4_Data_Panel.Controls.Add(this.AD4_Day1_CheckBox);
		this.AD4_Data_Panel.Controls.Add(this.AD4_Data_NumericUpDown);
		this.AD4_Data_Panel.Controls.Add(this.AD4_Mark0_Label);
		resources.ApplyResources(this.AD4_Data_Panel, "AD4_Data_Panel");
		this.AD4_Data_Panel.Name = "AD4_Data_Panel";
		this.AD4_Day_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Day4", true));
		resources.ApplyResources(this.AD4_Day_NumericUpDown, "AD4_Day_NumericUpDown");
		this.AD4_Day_NumericUpDown.Maximum = new decimal(new int[4] { 127, 0, 0, 0 });
		this.AD4_Day_NumericUpDown.Name = "AD4_Day_NumericUpDown";
		this.AD4_Day_NumericUpDown.ValueChanged += new System.EventHandler(AD4_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD4_L1_Label, "AD4_L1_Label");
		this.AD4_L1_Label.Name = "AD4_L1_Label";
		resources.ApplyResources(this.AD4_Data_1_RadioButton, "AD4_Data_1_RadioButton");
		this.AD4_Data_1_RadioButton.Name = "AD4_Data_1_RadioButton";
		this.AD4_Data_1_RadioButton.UseVisualStyleBackColor = true;
		this.AD4_Data_1_RadioButton.CheckedChanged += new System.EventHandler(AD4_Data_x_RadioButton_CheckedChanged);
		resources.ApplyResources(this.AD4_Data_0_RadioButton, "AD4_Data_0_RadioButton");
		this.AD4_Data_0_RadioButton.Checked = true;
		this.AD4_Data_0_RadioButton.Name = "AD4_Data_0_RadioButton";
		this.AD4_Data_0_RadioButton.TabStop = true;
		this.AD4_Data_0_RadioButton.UseVisualStyleBackColor = true;
		this.AD4_Data_0_RadioButton.CheckedChanged += new System.EventHandler(AD4_Data_x_RadioButton_CheckedChanged);
		resources.ApplyResources(this.AD4_Day0_CheckBox, "AD4_Day0_CheckBox");
		this.AD4_Day0_CheckBox.Name = "AD4_Day0_CheckBox";
		this.AD4_Day0_CheckBox.UseVisualStyleBackColor = true;
		this.AD4_Day0_CheckBox.CheckedChanged += new System.EventHandler(AD4_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD4_L0_Label, "AD4_L0_Label");
		this.AD4_L0_Label.Name = "AD4_L0_Label";
		resources.ApplyResources(this.AD4_Day6_CheckBox, "AD4_Day6_CheckBox");
		this.AD4_Day6_CheckBox.Name = "AD4_Day6_CheckBox";
		this.AD4_Day6_CheckBox.UseVisualStyleBackColor = true;
		this.AD4_Day6_CheckBox.CheckedChanged += new System.EventHandler(AD4_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD4_Day5_CheckBox, "AD4_Day5_CheckBox");
		this.AD4_Day5_CheckBox.Name = "AD4_Day5_CheckBox";
		this.AD4_Day5_CheckBox.UseVisualStyleBackColor = true;
		this.AD4_Day5_CheckBox.CheckedChanged += new System.EventHandler(AD4_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD4_Day4_CheckBox, "AD4_Day4_CheckBox");
		this.AD4_Day4_CheckBox.Name = "AD4_Day4_CheckBox";
		this.AD4_Day4_CheckBox.UseVisualStyleBackColor = true;
		this.AD4_Day4_CheckBox.CheckedChanged += new System.EventHandler(AD4_Day_CheckBox_CheckedChanged);
		this.AD4_VF_High_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Up4", true));
		this.AD4_VF_High_NumericUpDown.DecimalPlaces = 3;
		resources.ApplyResources(this.AD4_VF_High_NumericUpDown, "AD4_VF_High_NumericUpDown");
		this.AD4_VF_High_NumericUpDown.Maximum = new decimal(new int[4] { 99999, 0, 0, 0 });
		this.AD4_VF_High_NumericUpDown.Name = "AD4_VF_High_NumericUpDown";
		this.AD4_VF_High_NumericUpDown.ValueChanged += new System.EventHandler(AD4_VF_xxx_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.AD4_EnableDays_Label, "AD4_EnableDays_Label");
		this.AD4_EnableDays_Label.Name = "AD4_EnableDays_Label";
		resources.ApplyResources(this.AD4_ValueField_Label, "AD4_ValueField_Label");
		this.AD4_ValueField_Label.Name = "AD4_ValueField_Label";
		resources.ApplyResources(this.AD4_Day3_CheckBox, "AD4_Day3_CheckBox");
		this.AD4_Day3_CheckBox.Name = "AD4_Day3_CheckBox";
		this.AD4_Day3_CheckBox.UseVisualStyleBackColor = true;
		this.AD4_Day3_CheckBox.CheckedChanged += new System.EventHandler(AD4_Day_CheckBox_CheckedChanged);
		this.AD4_VF_Low_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Dn4", true));
		this.AD4_VF_Low_NumericUpDown.DecimalPlaces = 3;
		resources.ApplyResources(this.AD4_VF_Low_NumericUpDown, "AD4_VF_Low_NumericUpDown");
		this.AD4_VF_Low_NumericUpDown.Maximum = new decimal(new int[4] { 99999, 0, 0, 0 });
		this.AD4_VF_Low_NumericUpDown.Name = "AD4_VF_Low_NumericUpDown";
		this.AD4_VF_Low_NumericUpDown.ValueChanged += new System.EventHandler(AD4_VF_xxx_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.AD4_Day2_CheckBox, "AD4_Day2_CheckBox");
		this.AD4_Day2_CheckBox.Name = "AD4_Day2_CheckBox";
		this.AD4_Day2_CheckBox.UseVisualStyleBackColor = true;
		this.AD4_Day2_CheckBox.CheckedChanged += new System.EventHandler(AD4_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD4_DiscountTo_Label, "AD4_DiscountTo_Label");
		this.AD4_DiscountTo_Label.Name = "AD4_DiscountTo_Label";
		resources.ApplyResources(this.AD4_Day1_CheckBox, "AD4_Day1_CheckBox");
		this.AD4_Day1_CheckBox.Name = "AD4_Day1_CheckBox";
		this.AD4_Day1_CheckBox.UseVisualStyleBackColor = true;
		this.AD4_Day1_CheckBox.CheckedChanged += new System.EventHandler(AD4_Day_CheckBox_CheckedChanged);
		this.AD4_Data_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Num4", true));
		this.AD4_Data_NumericUpDown.DecimalPlaces = 2;
		resources.ApplyResources(this.AD4_Data_NumericUpDown, "AD4_Data_NumericUpDown");
		this.AD4_Data_NumericUpDown.Maximum = new decimal(new int[4] { 99999, 0, 0, 0 });
		this.AD4_Data_NumericUpDown.Minimum = new decimal(new int[4] { 99999, 0, 0, -2147483648 });
		this.AD4_Data_NumericUpDown.Name = "AD4_Data_NumericUpDown";
		this.AD4_Data_NumericUpDown.ValueChanged += new System.EventHandler(AD4_Data_x_RadioButton_CheckedChanged);
		resources.ApplyResources(this.AD4_Mark0_Label, "AD4_Mark0_Label");
		this.AD4_Mark0_Label.Name = "AD4_Mark0_Label";
		this.AD4_Sort_Panel.Controls.Add(this.AD4_Sort_Label);
		this.AD4_Sort_Panel.Controls.Add(this.AD4_Sort_ComboBox);
		resources.ApplyResources(this.AD4_Sort_Panel, "AD4_Sort_Panel");
		this.AD4_Sort_Panel.Name = "AD4_Sort_Panel";
		resources.ApplyResources(this.AD4_Sort_Label, "AD4_Sort_Label");
		this.AD4_Sort_Label.Name = "AD4_Sort_Label";
		this.AD4_Sort_ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "DA_Sort4", true));
		this.AD4_Sort_ComboBox.DataSource = this.pLUDASortBindingSource4;
		this.AD4_Sort_ComboBox.DisplayMember = "Display";
		this.AD4_Sort_ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.AD4_Sort_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.AD4_Sort_ComboBox, "AD4_Sort_ComboBox");
		this.AD4_Sort_ComboBox.Name = "AD4_Sort_ComboBox";
		this.AD4_Sort_ComboBox.ValueMember = "Value";
		this.AD4_Sort_ComboBox.SelectedIndexChanged += new System.EventHandler(ADx_Sort_ComboBox_SelectedIndexChanged);
		this.AD4_Sort_ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(pLUComboBox_Format);
		this.pLUDASortBindingSource4.DataMember = "PLU_DA_Sort";
		this.pLUDASortBindingSource4.DataSource = this.uiDataSet;
		this.pLUDASortBindingSource4.Sort = "Value";
		this.AD3_Data_Panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.AD3_Data_Panel.Controls.Add(this.AD3_Day_NumericUpDown);
		this.AD3_Data_Panel.Controls.Add(this.AD3_L1_Label);
		this.AD3_Data_Panel.Controls.Add(this.AD3_Data_1_RadioButton);
		this.AD3_Data_Panel.Controls.Add(this.AD3_Data_0_RadioButton);
		this.AD3_Data_Panel.Controls.Add(this.AD3_L0_Label);
		this.AD3_Data_Panel.Controls.Add(this.AD3_Day0_CheckBox);
		this.AD3_Data_Panel.Controls.Add(this.AD3_Day6_CheckBox);
		this.AD3_Data_Panel.Controls.Add(this.AD3_Day5_CheckBox);
		this.AD3_Data_Panel.Controls.Add(this.AD3_Day4_CheckBox);
		this.AD3_Data_Panel.Controls.Add(this.AD3_VF_High_NumericUpDown);
		this.AD3_Data_Panel.Controls.Add(this.AD3_EnableDays_Label);
		this.AD3_Data_Panel.Controls.Add(this.AD3_ValueField_Label);
		this.AD3_Data_Panel.Controls.Add(this.AD3_Day3_CheckBox);
		this.AD3_Data_Panel.Controls.Add(this.AD3_VF_Low_NumericUpDown);
		this.AD3_Data_Panel.Controls.Add(this.AD3_Day2_CheckBox);
		this.AD3_Data_Panel.Controls.Add(this.AD3_DiscountTo_Label);
		this.AD3_Data_Panel.Controls.Add(this.AD3_Day1_CheckBox);
		this.AD3_Data_Panel.Controls.Add(this.AD3_Data_NumericUpDown);
		this.AD3_Data_Panel.Controls.Add(this.AD3_Mark0_Label);
		resources.ApplyResources(this.AD3_Data_Panel, "AD3_Data_Panel");
		this.AD3_Data_Panel.Name = "AD3_Data_Panel";
		this.AD3_Day_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Day3", true));
		resources.ApplyResources(this.AD3_Day_NumericUpDown, "AD3_Day_NumericUpDown");
		this.AD3_Day_NumericUpDown.Maximum = new decimal(new int[4] { 127, 0, 0, 0 });
		this.AD3_Day_NumericUpDown.Name = "AD3_Day_NumericUpDown";
		this.AD3_Day_NumericUpDown.ValueChanged += new System.EventHandler(AD3_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD3_L1_Label, "AD3_L1_Label");
		this.AD3_L1_Label.Name = "AD3_L1_Label";
		resources.ApplyResources(this.AD3_Data_1_RadioButton, "AD3_Data_1_RadioButton");
		this.AD3_Data_1_RadioButton.Name = "AD3_Data_1_RadioButton";
		this.AD3_Data_1_RadioButton.UseVisualStyleBackColor = true;
		this.AD3_Data_1_RadioButton.CheckedChanged += new System.EventHandler(AD3_Data_x_RadioButton_CheckedChanged);
		resources.ApplyResources(this.AD3_Data_0_RadioButton, "AD3_Data_0_RadioButton");
		this.AD3_Data_0_RadioButton.Checked = true;
		this.AD3_Data_0_RadioButton.Name = "AD3_Data_0_RadioButton";
		this.AD3_Data_0_RadioButton.TabStop = true;
		this.AD3_Data_0_RadioButton.UseVisualStyleBackColor = true;
		this.AD3_Data_0_RadioButton.CheckedChanged += new System.EventHandler(AD3_Data_x_RadioButton_CheckedChanged);
		resources.ApplyResources(this.AD3_L0_Label, "AD3_L0_Label");
		this.AD3_L0_Label.Name = "AD3_L0_Label";
		resources.ApplyResources(this.AD3_Day0_CheckBox, "AD3_Day0_CheckBox");
		this.AD3_Day0_CheckBox.Name = "AD3_Day0_CheckBox";
		this.AD3_Day0_CheckBox.UseVisualStyleBackColor = true;
		this.AD3_Day0_CheckBox.CheckedChanged += new System.EventHandler(AD3_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD3_Day6_CheckBox, "AD3_Day6_CheckBox");
		this.AD3_Day6_CheckBox.Name = "AD3_Day6_CheckBox";
		this.AD3_Day6_CheckBox.UseVisualStyleBackColor = true;
		this.AD3_Day6_CheckBox.CheckedChanged += new System.EventHandler(AD3_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD3_Day5_CheckBox, "AD3_Day5_CheckBox");
		this.AD3_Day5_CheckBox.Name = "AD3_Day5_CheckBox";
		this.AD3_Day5_CheckBox.UseVisualStyleBackColor = true;
		this.AD3_Day5_CheckBox.CheckedChanged += new System.EventHandler(AD3_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD3_Day4_CheckBox, "AD3_Day4_CheckBox");
		this.AD3_Day4_CheckBox.Name = "AD3_Day4_CheckBox";
		this.AD3_Day4_CheckBox.UseVisualStyleBackColor = true;
		this.AD3_Day4_CheckBox.CheckedChanged += new System.EventHandler(AD3_Day_CheckBox_CheckedChanged);
		this.AD3_VF_High_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Up3", true));
		this.AD3_VF_High_NumericUpDown.DecimalPlaces = 3;
		resources.ApplyResources(this.AD3_VF_High_NumericUpDown, "AD3_VF_High_NumericUpDown");
		this.AD3_VF_High_NumericUpDown.Maximum = new decimal(new int[4] { 99999, 0, 0, 0 });
		this.AD3_VF_High_NumericUpDown.Name = "AD3_VF_High_NumericUpDown";
		this.AD3_VF_High_NumericUpDown.ValueChanged += new System.EventHandler(AD3_VF_xxx_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.AD3_EnableDays_Label, "AD3_EnableDays_Label");
		this.AD3_EnableDays_Label.Name = "AD3_EnableDays_Label";
		resources.ApplyResources(this.AD3_ValueField_Label, "AD3_ValueField_Label");
		this.AD3_ValueField_Label.Name = "AD3_ValueField_Label";
		resources.ApplyResources(this.AD3_Day3_CheckBox, "AD3_Day3_CheckBox");
		this.AD3_Day3_CheckBox.Name = "AD3_Day3_CheckBox";
		this.AD3_Day3_CheckBox.UseVisualStyleBackColor = true;
		this.AD3_Day3_CheckBox.CheckedChanged += new System.EventHandler(AD3_Day_CheckBox_CheckedChanged);
		this.AD3_VF_Low_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Dn3", true));
		this.AD3_VF_Low_NumericUpDown.DecimalPlaces = 3;
		resources.ApplyResources(this.AD3_VF_Low_NumericUpDown, "AD3_VF_Low_NumericUpDown");
		this.AD3_VF_Low_NumericUpDown.Maximum = new decimal(new int[4] { 99999, 0, 0, 0 });
		this.AD3_VF_Low_NumericUpDown.Name = "AD3_VF_Low_NumericUpDown";
		this.AD3_VF_Low_NumericUpDown.ValueChanged += new System.EventHandler(AD3_VF_xxx_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.AD3_Day2_CheckBox, "AD3_Day2_CheckBox");
		this.AD3_Day2_CheckBox.Name = "AD3_Day2_CheckBox";
		this.AD3_Day2_CheckBox.UseVisualStyleBackColor = true;
		this.AD3_Day2_CheckBox.CheckedChanged += new System.EventHandler(AD3_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD3_DiscountTo_Label, "AD3_DiscountTo_Label");
		this.AD3_DiscountTo_Label.Name = "AD3_DiscountTo_Label";
		resources.ApplyResources(this.AD3_Day1_CheckBox, "AD3_Day1_CheckBox");
		this.AD3_Day1_CheckBox.Name = "AD3_Day1_CheckBox";
		this.AD3_Day1_CheckBox.UseVisualStyleBackColor = true;
		this.AD3_Day1_CheckBox.CheckedChanged += new System.EventHandler(AD3_Day_CheckBox_CheckedChanged);
		this.AD3_Data_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Num3", true));
		this.AD3_Data_NumericUpDown.DecimalPlaces = 2;
		resources.ApplyResources(this.AD3_Data_NumericUpDown, "AD3_Data_NumericUpDown");
		this.AD3_Data_NumericUpDown.Maximum = new decimal(new int[4] { 99999, 0, 0, 0 });
		this.AD3_Data_NumericUpDown.Minimum = new decimal(new int[4] { 99999, 0, 0, -2147483648 });
		this.AD3_Data_NumericUpDown.Name = "AD3_Data_NumericUpDown";
		this.AD3_Data_NumericUpDown.ValueChanged += new System.EventHandler(AD3_Data_x_RadioButton_CheckedChanged);
		resources.ApplyResources(this.AD3_Mark0_Label, "AD3_Mark0_Label");
		this.AD3_Mark0_Label.Name = "AD3_Mark0_Label";
		this.AD3_Sort_Panel.Controls.Add(this.AD3_Sort_Label);
		this.AD3_Sort_Panel.Controls.Add(this.AD3_Sort_ComboBox);
		resources.ApplyResources(this.AD3_Sort_Panel, "AD3_Sort_Panel");
		this.AD3_Sort_Panel.Name = "AD3_Sort_Panel";
		resources.ApplyResources(this.AD3_Sort_Label, "AD3_Sort_Label");
		this.AD3_Sort_Label.Name = "AD3_Sort_Label";
		this.AD3_Sort_ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "DA_Sort3", true));
		this.AD3_Sort_ComboBox.DataSource = this.pLUDASortBindingSource3;
		this.AD3_Sort_ComboBox.DisplayMember = "Display";
		this.AD3_Sort_ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.AD3_Sort_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.AD3_Sort_ComboBox, "AD3_Sort_ComboBox");
		this.AD3_Sort_ComboBox.Name = "AD3_Sort_ComboBox";
		this.AD3_Sort_ComboBox.ValueMember = "Value";
		this.AD3_Sort_ComboBox.SelectedIndexChanged += new System.EventHandler(ADx_Sort_ComboBox_SelectedIndexChanged);
		this.AD3_Sort_ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(pLUComboBox_Format);
		this.pLUDASortBindingSource3.DataMember = "PLU_DA_Sort";
		this.pLUDASortBindingSource3.DataSource = this.uiDataSet;
		this.pLUDASortBindingSource3.Sort = "Value";
		this.AD2_Sort_Panel.Controls.Add(this.AD2_Sort_Label);
		this.AD2_Sort_Panel.Controls.Add(this.AD2_Sort_ComboBox);
		resources.ApplyResources(this.AD2_Sort_Panel, "AD2_Sort_Panel");
		this.AD2_Sort_Panel.Name = "AD2_Sort_Panel";
		resources.ApplyResources(this.AD2_Sort_Label, "AD2_Sort_Label");
		this.AD2_Sort_Label.Name = "AD2_Sort_Label";
		this.AD2_Sort_ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "DA_Sort2", true));
		this.AD2_Sort_ComboBox.DataSource = this.pLUDASortBindingSource2;
		this.AD2_Sort_ComboBox.DisplayMember = "Display";
		this.AD2_Sort_ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.AD2_Sort_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.AD2_Sort_ComboBox, "AD2_Sort_ComboBox");
		this.AD2_Sort_ComboBox.Name = "AD2_Sort_ComboBox";
		this.AD2_Sort_ComboBox.ValueMember = "Value";
		this.AD2_Sort_ComboBox.SelectedIndexChanged += new System.EventHandler(ADx_Sort_ComboBox_SelectedIndexChanged);
		this.AD2_Sort_ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(pLUComboBox_Format);
		this.pLUDASortBindingSource2.DataMember = "PLU_DA_Sort";
		this.pLUDASortBindingSource2.DataSource = this.uiDataSet;
		this.pLUDASortBindingSource2.Sort = "Value";
		this.AD1_Sort_Panel.Controls.Add(this.AD1_Sort_Label);
		this.AD1_Sort_Panel.Controls.Add(this.AD1_Sort_ComboBox);
		resources.ApplyResources(this.AD1_Sort_Panel, "AD1_Sort_Panel");
		this.AD1_Sort_Panel.Name = "AD1_Sort_Panel";
		resources.ApplyResources(this.AD1_Sort_Label, "AD1_Sort_Label");
		this.AD1_Sort_Label.Name = "AD1_Sort_Label";
		this.AD1_Sort_ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "DA_Sort1", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.AD1_Sort_ComboBox.DataSource = this.pLUDASortBindingSource1;
		this.AD1_Sort_ComboBox.DisplayMember = "Display";
		this.AD1_Sort_ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.AD1_Sort_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.AD1_Sort_ComboBox, "AD1_Sort_ComboBox");
		this.AD1_Sort_ComboBox.Name = "AD1_Sort_ComboBox";
		this.AD1_Sort_ComboBox.ValueMember = "Value";
		this.AD1_Sort_ComboBox.SelectedIndexChanged += new System.EventHandler(ADx_Sort_ComboBox_SelectedIndexChanged);
		this.AD1_Sort_ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(pLUComboBox_Format);
		this.pLUDASortBindingSource1.DataMember = "PLU_DA_Sort";
		this.pLUDASortBindingSource1.DataSource = this.uiDataSet;
		this.pLUDASortBindingSource1.Sort = "Value";
		this.AD1_Data_Panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.AD1_Data_Panel.Controls.Add(this.AD1_Day_NumericUpDown);
		this.AD1_Data_Panel.Controls.Add(this.AD1_L1_Label);
		this.AD1_Data_Panel.Controls.Add(this.AD1_Data_1_RadioButton);
		this.AD1_Data_Panel.Controls.Add(this.AD1_L0_Label);
		this.AD1_Data_Panel.Controls.Add(this.AD1_Data_0_RadioButton);
		this.AD1_Data_Panel.Controls.Add(this.AD1_Day0_CheckBox);
		this.AD1_Data_Panel.Controls.Add(this.AD1_Day6_CheckBox);
		this.AD1_Data_Panel.Controls.Add(this.AD1_Day5_CheckBox);
		this.AD1_Data_Panel.Controls.Add(this.AD1_Day4_CheckBox);
		this.AD1_Data_Panel.Controls.Add(this.AD1_VF_High_NumericUpDown);
		this.AD1_Data_Panel.Controls.Add(this.AD1_EnableDays_Label);
		this.AD1_Data_Panel.Controls.Add(this.AD1_ValueField_Label);
		this.AD1_Data_Panel.Controls.Add(this.AD1_Day3_CheckBox);
		this.AD1_Data_Panel.Controls.Add(this.AD1_VF_Low_NumericUpDown);
		this.AD1_Data_Panel.Controls.Add(this.AD1_Day2_CheckBox);
		this.AD1_Data_Panel.Controls.Add(this.AD1_DiscountTo_Label);
		this.AD1_Data_Panel.Controls.Add(this.AD1_Day1_CheckBox);
		this.AD1_Data_Panel.Controls.Add(this.AD1_Data_NumericUpDown);
		this.AD1_Data_Panel.Controls.Add(this.AD1_Mark0_Label);
		resources.ApplyResources(this.AD1_Data_Panel, "AD1_Data_Panel");
		this.AD1_Data_Panel.Name = "AD1_Data_Panel";
		this.AD1_Day_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Day1", true));
		resources.ApplyResources(this.AD1_Day_NumericUpDown, "AD1_Day_NumericUpDown");
		this.AD1_Day_NumericUpDown.Maximum = new decimal(new int[4] { 127, 0, 0, 0 });
		this.AD1_Day_NumericUpDown.Name = "AD1_Day_NumericUpDown";
		this.AD1_Day_NumericUpDown.ValueChanged += new System.EventHandler(AD1_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD1_L1_Label, "AD1_L1_Label");
		this.AD1_L1_Label.Name = "AD1_L1_Label";
		resources.ApplyResources(this.AD1_Data_1_RadioButton, "AD1_Data_1_RadioButton");
		this.AD1_Data_1_RadioButton.Name = "AD1_Data_1_RadioButton";
		this.AD1_Data_1_RadioButton.UseVisualStyleBackColor = true;
		this.AD1_Data_1_RadioButton.CheckedChanged += new System.EventHandler(AD1_Data_x_RadioButton_CheckedChanged);
		resources.ApplyResources(this.AD1_L0_Label, "AD1_L0_Label");
		this.AD1_L0_Label.Name = "AD1_L0_Label";
		resources.ApplyResources(this.AD1_Data_0_RadioButton, "AD1_Data_0_RadioButton");
		this.AD1_Data_0_RadioButton.Checked = true;
		this.AD1_Data_0_RadioButton.Name = "AD1_Data_0_RadioButton";
		this.AD1_Data_0_RadioButton.TabStop = true;
		this.AD1_Data_0_RadioButton.UseVisualStyleBackColor = true;
		this.AD1_Data_0_RadioButton.CheckedChanged += new System.EventHandler(AD1_Data_x_RadioButton_CheckedChanged);
		resources.ApplyResources(this.AD1_Day0_CheckBox, "AD1_Day0_CheckBox");
		this.AD1_Day0_CheckBox.Name = "AD1_Day0_CheckBox";
		this.AD1_Day0_CheckBox.UseVisualStyleBackColor = true;
		this.AD1_Day0_CheckBox.CheckedChanged += new System.EventHandler(AD1_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD1_Day6_CheckBox, "AD1_Day6_CheckBox");
		this.AD1_Day6_CheckBox.Name = "AD1_Day6_CheckBox";
		this.AD1_Day6_CheckBox.UseVisualStyleBackColor = true;
		this.AD1_Day6_CheckBox.CheckedChanged += new System.EventHandler(AD1_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD1_Day5_CheckBox, "AD1_Day5_CheckBox");
		this.AD1_Day5_CheckBox.Name = "AD1_Day5_CheckBox";
		this.AD1_Day5_CheckBox.UseVisualStyleBackColor = true;
		this.AD1_Day5_CheckBox.CheckedChanged += new System.EventHandler(AD1_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD1_Day4_CheckBox, "AD1_Day4_CheckBox");
		this.AD1_Day4_CheckBox.Name = "AD1_Day4_CheckBox";
		this.AD1_Day4_CheckBox.UseVisualStyleBackColor = true;
		this.AD1_Day4_CheckBox.CheckedChanged += new System.EventHandler(AD1_Day_CheckBox_CheckedChanged);
		this.AD1_VF_High_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Up1", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.AD1_VF_High_NumericUpDown.DecimalPlaces = 3;
		resources.ApplyResources(this.AD1_VF_High_NumericUpDown, "AD1_VF_High_NumericUpDown");
		this.AD1_VF_High_NumericUpDown.Maximum = new decimal(new int[4] { 99999, 0, 0, 0 });
		this.AD1_VF_High_NumericUpDown.Name = "AD1_VF_High_NumericUpDown";
		this.AD1_VF_High_NumericUpDown.ValueChanged += new System.EventHandler(AD1_VF_xxx_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.AD1_EnableDays_Label, "AD1_EnableDays_Label");
		this.AD1_EnableDays_Label.Name = "AD1_EnableDays_Label";
		resources.ApplyResources(this.AD1_ValueField_Label, "AD1_ValueField_Label");
		this.AD1_ValueField_Label.Name = "AD1_ValueField_Label";
		resources.ApplyResources(this.AD1_Day3_CheckBox, "AD1_Day3_CheckBox");
		this.AD1_Day3_CheckBox.Name = "AD1_Day3_CheckBox";
		this.AD1_Day3_CheckBox.UseVisualStyleBackColor = true;
		this.AD1_Day3_CheckBox.CheckedChanged += new System.EventHandler(AD1_Day_CheckBox_CheckedChanged);
		this.AD1_VF_Low_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Dn1", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.AD1_VF_Low_NumericUpDown.DecimalPlaces = 3;
		resources.ApplyResources(this.AD1_VF_Low_NumericUpDown, "AD1_VF_Low_NumericUpDown");
		this.AD1_VF_Low_NumericUpDown.Maximum = new decimal(new int[4] { 99999, 0, 0, 0 });
		this.AD1_VF_Low_NumericUpDown.Name = "AD1_VF_Low_NumericUpDown";
		this.AD1_VF_Low_NumericUpDown.ValueChanged += new System.EventHandler(AD1_VF_xxx_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.AD1_Day2_CheckBox, "AD1_Day2_CheckBox");
		this.AD1_Day2_CheckBox.Name = "AD1_Day2_CheckBox";
		this.AD1_Day2_CheckBox.UseVisualStyleBackColor = true;
		this.AD1_Day2_CheckBox.CheckedChanged += new System.EventHandler(AD1_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD1_DiscountTo_Label, "AD1_DiscountTo_Label");
		this.AD1_DiscountTo_Label.Name = "AD1_DiscountTo_Label";
		resources.ApplyResources(this.AD1_Day1_CheckBox, "AD1_Day1_CheckBox");
		this.AD1_Day1_CheckBox.Name = "AD1_Day1_CheckBox";
		this.AD1_Day1_CheckBox.UseVisualStyleBackColor = true;
		this.AD1_Day1_CheckBox.CheckedChanged += new System.EventHandler(AD1_Day_CheckBox_CheckedChanged);
		this.AD1_Data_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Num1", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.AD1_Data_NumericUpDown.DecimalPlaces = 2;
		resources.ApplyResources(this.AD1_Data_NumericUpDown, "AD1_Data_NumericUpDown");
		this.AD1_Data_NumericUpDown.Maximum = new decimal(new int[4] { 99999, 0, 0, 0 });
		this.AD1_Data_NumericUpDown.Minimum = new decimal(new int[4] { 99999, 0, 0, -2147483648 });
		this.AD1_Data_NumericUpDown.Name = "AD1_Data_NumericUpDown";
		this.AD1_Data_NumericUpDown.ValueChanged += new System.EventHandler(AD1_Data_x_RadioButton_CheckedChanged);
		resources.ApplyResources(this.AD1_Mark0_Label, "AD1_Mark0_Label");
		this.AD1_Mark0_Label.Name = "AD1_Mark0_Label";
		this.InfoPanel.Controls.Add(this.InfoLabel_Transaction_1);
		this.InfoPanel.Controls.Add(this.InfoLabel_Transaction_0);
		this.InfoPanel.Controls.Add(this.InfoLabel_Transaction);
		this.InfoPanel.Controls.Add(this.InfoLabel_DiscountTo);
		this.InfoPanel.Controls.Add(this.InfoLabel_Day6);
		this.InfoPanel.Controls.Add(this.InfoLabel_Day5);
		this.InfoPanel.Controls.Add(this.InfoLabel_Day4);
		this.InfoPanel.Controls.Add(this.InfoLabel_Day3);
		this.InfoPanel.Controls.Add(this.InfoLabel_Day2);
		this.InfoPanel.Controls.Add(this.InfoLabel_Day1);
		this.InfoPanel.Controls.Add(this.InfoLabel_Value_3);
		this.InfoPanel.Controls.Add(this.InfoLabel_Value_2);
		this.InfoPanel.Controls.Add(this.InfoLabel_Value_1);
		this.InfoPanel.Controls.Add(this.InfoLabel_Day0);
		this.InfoPanel.Controls.Add(this.InfoLabel_EnableDays);
		this.InfoPanel.Controls.Add(this.InfoLabel_ValueField);
		resources.ApplyResources(this.InfoPanel, "InfoPanel");
		this.InfoPanel.Name = "InfoPanel";
		resources.ApplyResources(this.InfoLabel_Transaction_1, "InfoLabel_Transaction_1");
		this.InfoLabel_Transaction_1.Name = "InfoLabel_Transaction_1";
		resources.ApplyResources(this.InfoLabel_Transaction_0, "InfoLabel_Transaction_0");
		this.InfoLabel_Transaction_0.Name = "InfoLabel_Transaction_0";
		resources.ApplyResources(this.InfoLabel_Transaction, "InfoLabel_Transaction");
		this.InfoLabel_Transaction.Name = "InfoLabel_Transaction";
		resources.ApplyResources(this.InfoLabel_DiscountTo, "InfoLabel_DiscountTo");
		this.InfoLabel_DiscountTo.Name = "InfoLabel_DiscountTo";
		resources.ApplyResources(this.InfoLabel_Day6, "InfoLabel_Day6");
		this.InfoLabel_Day6.Name = "InfoLabel_Day6";
		resources.ApplyResources(this.InfoLabel_Day5, "InfoLabel_Day5");
		this.InfoLabel_Day5.Name = "InfoLabel_Day5";
		resources.ApplyResources(this.InfoLabel_Day4, "InfoLabel_Day4");
		this.InfoLabel_Day4.Name = "InfoLabel_Day4";
		resources.ApplyResources(this.InfoLabel_Day3, "InfoLabel_Day3");
		this.InfoLabel_Day3.Name = "InfoLabel_Day3";
		resources.ApplyResources(this.InfoLabel_Day2, "InfoLabel_Day2");
		this.InfoLabel_Day2.Name = "InfoLabel_Day2";
		resources.ApplyResources(this.InfoLabel_Day1, "InfoLabel_Day1");
		this.InfoLabel_Day1.Name = "InfoLabel_Day1";
		resources.ApplyResources(this.InfoLabel_Value_3, "InfoLabel_Value_3");
		this.InfoLabel_Value_3.Name = "InfoLabel_Value_3";
		resources.ApplyResources(this.InfoLabel_Value_2, "InfoLabel_Value_2");
		this.InfoLabel_Value_2.Name = "InfoLabel_Value_2";
		resources.ApplyResources(this.InfoLabel_Value_1, "InfoLabel_Value_1");
		this.InfoLabel_Value_1.Name = "InfoLabel_Value_1";
		resources.ApplyResources(this.InfoLabel_Day0, "InfoLabel_Day0");
		this.InfoLabel_Day0.Name = "InfoLabel_Day0";
		resources.ApplyResources(this.InfoLabel_EnableDays, "InfoLabel_EnableDays");
		this.InfoLabel_EnableDays.Name = "InfoLabel_EnableDays";
		resources.ApplyResources(this.InfoLabel_ValueField, "InfoLabel_ValueField");
		this.InfoLabel_ValueField.Name = "InfoLabel_ValueField";
		this.AD2_Data_Panel.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.AD2_Data_Panel.Controls.Add(this.AD2_Day_NumericUpDown);
		this.AD2_Data_Panel.Controls.Add(this.AD2_L1_Label);
		this.AD2_Data_Panel.Controls.Add(this.AD2_L0_Label);
		this.AD2_Data_Panel.Controls.Add(this.AD2_Data_1_RadioButton);
		this.AD2_Data_Panel.Controls.Add(this.AD2_Data_0_RadioButton);
		this.AD2_Data_Panel.Controls.Add(this.AD2_Day0_CheckBox);
		this.AD2_Data_Panel.Controls.Add(this.AD2_Day6_CheckBox);
		this.AD2_Data_Panel.Controls.Add(this.AD2_Day5_CheckBox);
		this.AD2_Data_Panel.Controls.Add(this.AD2_Day4_CheckBox);
		this.AD2_Data_Panel.Controls.Add(this.AD2_VF_High_NumericUpDown);
		this.AD2_Data_Panel.Controls.Add(this.AD2_EnableDays_Label);
		this.AD2_Data_Panel.Controls.Add(this.AD2_ValueField_Label);
		this.AD2_Data_Panel.Controls.Add(this.AD2_Day3_CheckBox);
		this.AD2_Data_Panel.Controls.Add(this.AD2_VF_Low_NumericUpDown);
		this.AD2_Data_Panel.Controls.Add(this.AD2_Day2_CheckBox);
		this.AD2_Data_Panel.Controls.Add(this.AD2_DiscountTo_Label);
		this.AD2_Data_Panel.Controls.Add(this.AD2_Day1_CheckBox);
		this.AD2_Data_Panel.Controls.Add(this.AD2_Data_NumericUpDown);
		this.AD2_Data_Panel.Controls.Add(this.AD2_Mark0_Label);
		resources.ApplyResources(this.AD2_Data_Panel, "AD2_Data_Panel");
		this.AD2_Data_Panel.Name = "AD2_Data_Panel";
		this.AD2_Day_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Day2", true));
		resources.ApplyResources(this.AD2_Day_NumericUpDown, "AD2_Day_NumericUpDown");
		this.AD2_Day_NumericUpDown.Maximum = new decimal(new int[4] { 127, 0, 0, 0 });
		this.AD2_Day_NumericUpDown.Name = "AD2_Day_NumericUpDown";
		this.AD2_Day_NumericUpDown.ValueChanged += new System.EventHandler(AD2_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD2_L1_Label, "AD2_L1_Label");
		this.AD2_L1_Label.Name = "AD2_L1_Label";
		resources.ApplyResources(this.AD2_L0_Label, "AD2_L0_Label");
		this.AD2_L0_Label.Name = "AD2_L0_Label";
		resources.ApplyResources(this.AD2_Data_1_RadioButton, "AD2_Data_1_RadioButton");
		this.AD2_Data_1_RadioButton.Name = "AD2_Data_1_RadioButton";
		this.AD2_Data_1_RadioButton.UseVisualStyleBackColor = true;
		this.AD2_Data_1_RadioButton.CheckedChanged += new System.EventHandler(AD2_Data_x_RadioButton_CheckedChanged);
		resources.ApplyResources(this.AD2_Data_0_RadioButton, "AD2_Data_0_RadioButton");
		this.AD2_Data_0_RadioButton.Checked = true;
		this.AD2_Data_0_RadioButton.Name = "AD2_Data_0_RadioButton";
		this.AD2_Data_0_RadioButton.TabStop = true;
		this.AD2_Data_0_RadioButton.UseVisualStyleBackColor = true;
		this.AD2_Data_0_RadioButton.CheckedChanged += new System.EventHandler(AD2_Data_x_RadioButton_CheckedChanged);
		resources.ApplyResources(this.AD2_Day0_CheckBox, "AD2_Day0_CheckBox");
		this.AD2_Day0_CheckBox.Name = "AD2_Day0_CheckBox";
		this.AD2_Day0_CheckBox.UseVisualStyleBackColor = true;
		this.AD2_Day0_CheckBox.CheckedChanged += new System.EventHandler(AD2_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD2_Day6_CheckBox, "AD2_Day6_CheckBox");
		this.AD2_Day6_CheckBox.Name = "AD2_Day6_CheckBox";
		this.AD2_Day6_CheckBox.UseVisualStyleBackColor = true;
		this.AD2_Day6_CheckBox.CheckedChanged += new System.EventHandler(AD2_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD2_Day5_CheckBox, "AD2_Day5_CheckBox");
		this.AD2_Day5_CheckBox.Name = "AD2_Day5_CheckBox";
		this.AD2_Day5_CheckBox.UseVisualStyleBackColor = true;
		this.AD2_Day5_CheckBox.CheckedChanged += new System.EventHandler(AD2_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD2_Day4_CheckBox, "AD2_Day4_CheckBox");
		this.AD2_Day4_CheckBox.Name = "AD2_Day4_CheckBox";
		this.AD2_Day4_CheckBox.UseVisualStyleBackColor = true;
		this.AD2_Day4_CheckBox.CheckedChanged += new System.EventHandler(AD2_Day_CheckBox_CheckedChanged);
		this.AD2_VF_High_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Up2", true));
		this.AD2_VF_High_NumericUpDown.DecimalPlaces = 3;
		resources.ApplyResources(this.AD2_VF_High_NumericUpDown, "AD2_VF_High_NumericUpDown");
		this.AD2_VF_High_NumericUpDown.Maximum = new decimal(new int[4] { 99999, 0, 0, 0 });
		this.AD2_VF_High_NumericUpDown.Name = "AD2_VF_High_NumericUpDown";
		this.AD2_VF_High_NumericUpDown.ValueChanged += new System.EventHandler(AD2_VF_xxx_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.AD2_EnableDays_Label, "AD2_EnableDays_Label");
		this.AD2_EnableDays_Label.Name = "AD2_EnableDays_Label";
		resources.ApplyResources(this.AD2_ValueField_Label, "AD2_ValueField_Label");
		this.AD2_ValueField_Label.Name = "AD2_ValueField_Label";
		resources.ApplyResources(this.AD2_Day3_CheckBox, "AD2_Day3_CheckBox");
		this.AD2_Day3_CheckBox.Name = "AD2_Day3_CheckBox";
		this.AD2_Day3_CheckBox.UseVisualStyleBackColor = true;
		this.AD2_Day3_CheckBox.CheckedChanged += new System.EventHandler(AD2_Day_CheckBox_CheckedChanged);
		this.AD2_VF_Low_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Dn2", true));
		this.AD2_VF_Low_NumericUpDown.DecimalPlaces = 3;
		resources.ApplyResources(this.AD2_VF_Low_NumericUpDown, "AD2_VF_Low_NumericUpDown");
		this.AD2_VF_Low_NumericUpDown.Maximum = new decimal(new int[4] { 99999, 0, 0, 0 });
		this.AD2_VF_Low_NumericUpDown.Name = "AD2_VF_Low_NumericUpDown";
		this.AD2_VF_Low_NumericUpDown.ValueChanged += new System.EventHandler(AD2_VF_xxx_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.AD2_Day2_CheckBox, "AD2_Day2_CheckBox");
		this.AD2_Day2_CheckBox.Name = "AD2_Day2_CheckBox";
		this.AD2_Day2_CheckBox.UseVisualStyleBackColor = true;
		this.AD2_Day2_CheckBox.CheckedChanged += new System.EventHandler(AD2_Day_CheckBox_CheckedChanged);
		resources.ApplyResources(this.AD2_DiscountTo_Label, "AD2_DiscountTo_Label");
		this.AD2_DiscountTo_Label.Name = "AD2_DiscountTo_Label";
		resources.ApplyResources(this.AD2_Day1_CheckBox, "AD2_Day1_CheckBox");
		this.AD2_Day1_CheckBox.Name = "AD2_Day1_CheckBox";
		this.AD2_Day1_CheckBox.UseVisualStyleBackColor = true;
		this.AD2_Day1_CheckBox.CheckedChanged += new System.EventHandler(AD2_Day_CheckBox_CheckedChanged);
		this.AD2_Data_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DA_Num2", true));
		this.AD2_Data_NumericUpDown.DecimalPlaces = 2;
		resources.ApplyResources(this.AD2_Data_NumericUpDown, "AD2_Data_NumericUpDown");
		this.AD2_Data_NumericUpDown.Maximum = new decimal(new int[4] { 99999, 0, 0, 0 });
		this.AD2_Data_NumericUpDown.Minimum = new decimal(new int[4] { 99999, 0, 0, -2147483648 });
		this.AD2_Data_NumericUpDown.Name = "AD2_Data_NumericUpDown";
		this.AD2_Data_NumericUpDown.ValueChanged += new System.EventHandler(AD2_Data_x_RadioButton_CheckedChanged);
		resources.ApplyResources(this.AD2_Mark0_Label, "AD2_Mark0_Label");
		this.AD2_Mark0_Label.Name = "AD2_Mark0_Label";
		resources.ApplyResources(this.label1, "label1");
		this.label1.Name = "label1";
		resources.ApplyResources(this.dF_ULabel, "dF_ULabel");
		this.dF_ULabel.Name = "dF_ULabel";
		this.dF_UComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "DF_U", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.dF_UComboBox.DataSource = this.pLUDFUBindingSource;
		this.dF_UComboBox.DisplayMember = "Display";
		this.dF_UComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.dF_UComboBox.DropDownWidth = 200;
		this.dF_UComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.dF_UComboBox, "dF_UComboBox");
		this.dF_UComboBox.Name = "dF_UComboBox";
		this.dF_UComboBox.ValueMember = "Value";
		this.dF_UComboBox.SelectedIndexChanged += new System.EventHandler(dF_UComboBox_SelectedIndexChanged);
		this.dF_UComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(pLUComboBox_Format);
		this.pLUDFUBindingSource.DataMember = "PLU_DF_U";
		this.pLUDFUBindingSource.DataSource = this.uiDataSet;
		this.pLUDFUBindingSource.Sort = "Value";
		resources.ApplyResources(this.dF_DLabel, "dF_DLabel");
		this.dF_DLabel.Name = "dF_DLabel";
		this.dF_DComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.pLUBindingSource, "DF_D", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.dF_DComboBox.DataSource = this.pLUDFDBindingSource;
		this.dF_DComboBox.DisplayMember = "Display";
		this.dF_DComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.dF_DComboBox.DropDownWidth = 200;
		this.dF_DComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.dF_DComboBox, "dF_DComboBox");
		this.dF_DComboBox.Name = "dF_DComboBox";
		this.dF_DComboBox.ValueMember = "Value";
		this.dF_DComboBox.SelectedIndexChanged += new System.EventHandler(dF_DComboBox_SelectedIndexChanged);
		this.dF_DComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(pLUComboBox_Format);
		this.pLUDFDBindingSource.DataMember = "PLU_DF_D";
		this.pLUDFDBindingSource.DataSource = this.uiDataSet;
		this.pLUDFDBindingSource.Sort = "Value";
		this.dF_UNNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DF_UN", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.dF_UNNumericUpDown.DecimalPlaces = 2;
		resources.ApplyResources(this.dF_UNNumericUpDown, "dF_UNNumericUpDown");
		this.dF_UNNumericUpDown.Maximum = new decimal(new int[4] { 9999999, 0, 0, 0 });
		this.dF_UNNumericUpDown.Name = "dF_UNNumericUpDown";
		this.dF_DNNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.pLUBindingSource, "DF_DN", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.dF_DNNumericUpDown.DecimalPlaces = 2;
		resources.ApplyResources(this.dF_DNNumericUpDown, "dF_DNNumericUpDown");
		this.dF_DNNumericUpDown.Maximum = new decimal(new int[4] { 9999999, 0, 0, 0 });
		this.dF_DNNumericUpDown.Name = "dF_DNNumericUpDown";
		this.pLUBindingNavigator.AddNewItem = null;
		this.pLUBindingNavigator.BindingSource = this.pLUBindingSource;
		this.pLUBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.pLUBindingNavigator.DeleteItem = null;
		this.pLUBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[21]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem, this.cloneToolStripButton, this.toolStripSeparator1, this.bindingNavigatorID, this.gotoType_ToolStripDropDownButton, this.bindingNavigatorGoto, this.bindingNavigatorFilter, this.FilterAdd_ToolStripButton, this.validToolStripButton, this.P0_TMSFile_toolStripButton,
			this.P0_Ethernet_toolStripButton
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
		this.bindingNavigatorAddNewItem.Image = ECS.Properties.Resources.bindingNavigatorAddNewItem;
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
		this.bindingNavigatorAddNewItem.Click += new System.EventHandler(bindingNavigatorAddNewItem_Click);
		this.bindingNavigatorDeleteItem.Image = ECS.Properties.Resources.bindingNavigatorDeleteItem;
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
		this.bindingNavigatorDeleteItem.Click += new System.EventHandler(bindingNavigatorDeleteItem_Click);
		resources.ApplyResources(this.cloneToolStripButton, "cloneToolStripButton");
		this.cloneToolStripButton.Name = "cloneToolStripButton";
		this.cloneToolStripButton.Click += new System.EventHandler(cloneToolStripButton_Click);
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		this.bindingNavigatorID.Name = "bindingNavigatorID";
		resources.ApplyResources(this.bindingNavigatorID, "bindingNavigatorID");
		this.bindingNavigatorID.KeyDown += new System.Windows.Forms.KeyEventHandler(bindingNavigatorID_KeyDown);
		this.gotoType_ToolStripDropDownButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.None;
		this.gotoType_ToolStripDropDownButton.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[4] { this.numberToolStripMenuItem, this.itemCodeToolStripMenuItem, this.indexToolStripMenuItem, this.nameToolStripMenuItem });
		resources.ApplyResources(this.gotoType_ToolStripDropDownButton, "gotoType_ToolStripDropDownButton");
		this.gotoType_ToolStripDropDownButton.Name = "gotoType_ToolStripDropDownButton";
		this.numberToolStripMenuItem.Checked = true;
		this.numberToolStripMenuItem.CheckState = System.Windows.Forms.CheckState.Checked;
		this.numberToolStripMenuItem.Name = "numberToolStripMenuItem";
		resources.ApplyResources(this.numberToolStripMenuItem, "numberToolStripMenuItem");
		this.numberToolStripMenuItem.Click += new System.EventHandler(numberToolStripMenuItem_Click);
		this.itemCodeToolStripMenuItem.Name = "itemCodeToolStripMenuItem";
		resources.ApplyResources(this.itemCodeToolStripMenuItem, "itemCodeToolStripMenuItem");
		this.itemCodeToolStripMenuItem.Click += new System.EventHandler(numberToolStripMenuItem_Click);
		this.indexToolStripMenuItem.Name = "indexToolStripMenuItem";
		resources.ApplyResources(this.indexToolStripMenuItem, "indexToolStripMenuItem");
		this.indexToolStripMenuItem.Click += new System.EventHandler(numberToolStripMenuItem_Click);
		this.nameToolStripMenuItem.Name = "nameToolStripMenuItem";
		resources.ApplyResources(this.nameToolStripMenuItem, "nameToolStripMenuItem");
		this.nameToolStripMenuItem.Click += new System.EventHandler(numberToolStripMenuItem_Click);
		this.bindingNavigatorGoto.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorGoto.Image = ECS.Properties.Resources.bindingNavigatorGoto;
		resources.ApplyResources(this.bindingNavigatorGoto, "bindingNavigatorGoto");
		this.bindingNavigatorGoto.Name = "bindingNavigatorGoto";
		this.bindingNavigatorGoto.Click += new System.EventHandler(bindingNavigatorGoto_Click);
		this.bindingNavigatorFilter.CheckOnClick = true;
		this.bindingNavigatorFilter.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorFilter.Image = ECS.Properties.Resources.bindingNavigatorFilter;
		resources.ApplyResources(this.bindingNavigatorFilter, "bindingNavigatorFilter");
		this.bindingNavigatorFilter.Name = "bindingNavigatorFilter";
		this.bindingNavigatorFilter.CheckedChanged += new System.EventHandler(bindingNavigatorFilter_CheckedChanged);
		this.FilterAdd_ToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.FilterAdd_ToolStripButton, "FilterAdd_ToolStripButton");
		this.FilterAdd_ToolStripButton.Name = "FilterAdd_ToolStripButton";
		this.FilterAdd_ToolStripButton.Click += new System.EventHandler(FilterAdd_ToolStripButton_Click);
		this.validToolStripButton.Checked = true;
		this.validToolStripButton.CheckState = System.Windows.Forms.CheckState.Checked;
		this.validToolStripButton.Image = ECS.Properties.Resources.Checkbox;
		resources.ApplyResources(this.validToolStripButton, "validToolStripButton");
		this.validToolStripButton.Name = "validToolStripButton";
		this.validToolStripButton.Click += new System.EventHandler(validToolStripButton_Click);
		resources.ApplyResources(this.P0_TMSFile_toolStripButton, "P0_TMSFile_toolStripButton");
		this.P0_TMSFile_toolStripButton.Name = "P0_TMSFile_toolStripButton";
		this.P0_TMSFile_toolStripButton.Click += new System.EventHandler(P0_TMSFile_toolStripButton_Click);
		resources.ApplyResources(this.P0_Ethernet_toolStripButton, "P0_Ethernet_toolStripButton");
		this.P0_Ethernet_toolStripButton.Name = "P0_Ethernet_toolStripButton";
		this.P0_Ethernet_toolStripButton.Click += new System.EventHandler(P0_Ethernet_toolStripButton_Click);
		this.custom1TableAdapter.ClearBeforeFill = true;
		this.custom2TableAdapter.ClearBeforeFill = true;
		this.custom3TableAdapter.ClearBeforeFill = true;
		this.custom4TableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this.notifyIcon1, "notifyIcon1");
		this.timer_savetick.Interval = 2000;
		this.timer_savetick.Tick += new System.EventHandler(timer_savetick_Tick);
		this.ssp4BindingSource.DataSource = this.eCSDataSet;
		this.ssp4BindingSource.Position = 0;
		this.ssp3BindingSource.DataSource = this.eCSDataSet;
		this.ssp3BindingSource.Position = 0;
		this.ssp2BindingSource.DataSource = this.eCSDataSet;
		this.ssp2BindingSource.Position = 0;
		this.ssp1BindingSource.DataSource = this.eCSDataSet;
		this.ssp1BindingSource.Position = 0;
		this.pLUTableAdapter.ClearBeforeFill = true;
		this.classTableAdapter.ClearBeforeFill = true;
		this.labelTableAdapter.ClearBeforeFill = true;
		this.barcodeTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer);
		base.Controls.Add(this.pLUBindingNavigator);
		base.Name = "PluForm";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(PluForm_FormClosing);
		base.Load += new System.EventHandler(PluForm_Load);
		base.Leave += new System.EventHandler(PluForm_Leave);
		this.splitContainer.Panel1.ResumeLayout(false);
		this.splitContainer.Panel2.ResumeLayout(false);
		this.splitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.pLUDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.classBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLU_TaxTypeBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingSource1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingSource2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.bitmapBindingSource2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingSource).EndInit();
		this.tabControl.ResumeLayout(false);
		this.basicPage.ResumeLayout(false);
		this.Basic_TableLayoutPanel.ResumeLayout(false);
		this.Basic_TableLayoutPanel.PerformLayout();
		this.Basic_Unit_Panel.ResumeLayout(false);
		this.Basic_Unit_Panel.PerformLayout();
		this.Basic_Class_Panel.ResumeLayout(false);
		this.Basic_Class_Panel.PerformLayout();
		this.Basic_Fix1_Panel.ResumeLayout(false);
		this.Basic_Fix1_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.tareNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.FlagValue_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLUIDNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.Flag_NumericUpDown).EndInit();
		this.Basic_Measure_Panel.ResumeLayout(false);
		this.Basic_Measure_Panel.PerformLayout();
		this.Basic_Fix3_Panel.ResumeLayout(false);
		this.Basic_Fix3_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.priceNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.costNumericUpDown).EndInit();
		this.Basic_Tare_Panel.ResumeLayout(false);
		this.Basic_Tare_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.Tare_Pos_NumericUpDown).EndInit();
		this.Basic_TarePencent_Panel.ResumeLayout(false);
		this.Basic_TarePencent_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.TarePencent_Pos_NumericUpDown).EndInit();
		this.Basic_FixedWeight_Panel.ResumeLayout(false);
		this.Basic_FixedWeight_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.FixedWeight_Pos_NumericUpDown).EndInit();
		this.Basic_ItemCode_Panel.ResumeLayout(false);
		this.Basic_ItemCode_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.remarkNumericUpDown).EndInit();
		this.Basic_ALPHA_Panel.ResumeLayout(false);
		this.Basic_ALPHA_Panel.PerformLayout();
		this.Basic_TaxRate_Panel.ResumeLayout(false);
		this.Basic_TaxRate_Panel.PerformLayout();
		this.Basic_SSP1_Panel.ResumeLayout(false);
		this.Basic_SSP1_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.sspValue1NumericUpDown).EndInit();
		this.Basic_SType_Panel.ResumeLayout(false);
		this.Basic_SType_Panel.PerformLayout();
		this.Basic_TaxType_Panel.ResumeLayout(false);
		this.Basic_TaxType_Panel.PerformLayout();
		this.Basic_SSP4_Panel.ResumeLayout(false);
		this.Basic_SSP4_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.sspValue4NumericUpDown).EndInit();
		this.Basic_SSP3_Panel.ResumeLayout(false);
		this.Basic_SSP3_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.sspValue3NumericUpDown).EndInit();
		this.Basic_SSP2_Panel.ResumeLayout(false);
		this.Basic_SSP2_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.sspValue2NumericUpDown).EndInit();
		this.Basic_Index_Panel.ResumeLayout(false);
		this.Basic_Index_Panel.PerformLayout();
		this.Basic_SaveAsWeight_Panel.ResumeLayout(false);
		this.Basic_SaveAsWeight_Panel.PerformLayout();
		this.labelPage.ResumeLayout(false);
		this.Print_TableLayoutPanel.ResumeLayout(false);
		this.Print_Bill1_Panel.ResumeLayout(false);
		this.Print_Bill1_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.barF1NumericUpDown).EndInit();
		this.Print_Bill2_Panel.ResumeLayout(false);
		this.Print_Bill2_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.barF2NumericUpDown).EndInit();
		this.Print_Bitmap_Panel.ResumeLayout(false);
		this.Print_Bitmap_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.bitmapBindingSource).EndInit();
		this.textPage.ResumeLayout(false);
		this.Text_TableLayoutPanel.ResumeLayout(false);
		this.Text_1_Panel.ResumeLayout(false);
		this.Text_1_Panel.PerformLayout();
		this.Text_2_Panel.ResumeLayout(false);
		this.Text_2_Panel.PerformLayout();
		this.Text_3_Panel.ResumeLayout(false);
		this.Text_3_Panel.PerformLayout();
		this.Text_4_Panel.ResumeLayout(false);
		this.Text_4_Panel.PerformLayout();
		this.Text_5_Panel.ResumeLayout(false);
		this.Text_5_Panel.PerformLayout();
		this.Text_6_Panel.ResumeLayout(false);
		this.Text_6_Panel.PerformLayout();
		this.Text_7_Panel.ResumeLayout(false);
		this.Text_7_Panel.PerformLayout();
		this.timePage.ResumeLayout(false);
		this.tableLayoutPanel2.ResumeLayout(false);
		this.Time_TimeSD_1_Panel.ResumeLayout(false);
		this.Time_TimeSD_1_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUPSDateBindingSource1).EndInit();
		this.Time_TimeST_1_Panel.ResumeLayout(false);
		this.Time_TimeST_1_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUPSTimeBindingSource1).EndInit();
		this.Time_TimePD_1_Panel.ResumeLayout(false);
		this.Time_TimePD_1_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUPSDateBindingSource2).EndInit();
		this.Time_TimePT_1_Panel.ResumeLayout(false);
		this.Time_TimePT_1_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUPSTimeBindingSource2).EndInit();
		this.Time_TimeUD_1_Panel.ResumeLayout(false);
		this.Time_TimeUD_1_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUPSDateBindingSource3).EndInit();
		this.Time_TimeSD_2_Panel.ResumeLayout(false);
		this.Time_TimeSD_2_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pC_SDNumericUpDown).EndInit();
		this.Time_TimeST_2_Panel.ResumeLayout(false);
		this.Time_TimeST_2_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pC_ST_HNumericUpDown).EndInit();
		this.Time_TimePD_2_Panel.ResumeLayout(false);
		this.Time_TimePD_2_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pC_PDNumericUpDown).EndInit();
		this.Time_TimePT_2_Panel.ResumeLayout(false);
		this.Time_TimePT_2_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pC_PT_HNumericUpDown).EndInit();
		this.Time_TimeUD_2_Panel.ResumeLayout(false);
		this.Time_TimeUD_2_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pC_UDNumericUpDown).EndInit();
		this.discountPage.ResumeLayout(false);
		this.discountPage.PerformLayout();
		this.tableLayoutPanel1.ResumeLayout(false);
		this.tableLayoutPanel1.PerformLayout();
		this.AD4_Data_Panel.ResumeLayout(false);
		this.AD4_Data_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.AD4_Day_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.AD4_VF_High_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.AD4_VF_Low_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.AD4_Data_NumericUpDown).EndInit();
		this.AD4_Sort_Panel.ResumeLayout(false);
		this.AD4_Sort_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUDASortBindingSource4).EndInit();
		this.AD3_Data_Panel.ResumeLayout(false);
		this.AD3_Data_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.AD3_Day_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.AD3_VF_High_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.AD3_VF_Low_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.AD3_Data_NumericUpDown).EndInit();
		this.AD3_Sort_Panel.ResumeLayout(false);
		this.AD3_Sort_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUDASortBindingSource3).EndInit();
		this.AD2_Sort_Panel.ResumeLayout(false);
		this.AD2_Sort_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUDASortBindingSource2).EndInit();
		this.AD1_Sort_Panel.ResumeLayout(false);
		this.AD1_Sort_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUDASortBindingSource1).EndInit();
		this.AD1_Data_Panel.ResumeLayout(false);
		this.AD1_Data_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.AD1_Day_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.AD1_VF_High_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.AD1_VF_Low_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.AD1_Data_NumericUpDown).EndInit();
		this.InfoPanel.ResumeLayout(false);
		this.InfoPanel.PerformLayout();
		this.AD2_Data_Panel.ResumeLayout(false);
		this.AD2_Data_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.AD2_Day_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.AD2_VF_High_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.AD2_VF_Low_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.AD2_Data_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLUDFUBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLUDFDBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.dF_UNNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.dF_DNNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingNavigator).EndInit();
		this.pLUBindingNavigator.ResumeLayout(false);
		this.pLUBindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.ssp4BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ssp3BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ssp2BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ssp1BindingSource).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
