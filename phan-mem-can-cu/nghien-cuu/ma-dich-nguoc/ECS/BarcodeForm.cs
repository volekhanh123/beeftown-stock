using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;
using MyBarItemBox;

namespace ECS;

public class BarcodeForm : Form
{
	private delegate void DataSet_RefreshCallback(string Type);

	private const int BI_Max = 32;

	private BarItemBox[] BarItemBox;

	private bool NoCTRowChanged;

	private bool DataSet_Changed;

	private bool TChar_In;

	private IContainer components;

	private ECSDataSet eCSDataSet;

	private BindingSource barcodeBindingSource;

	private BarcodeTableAdapter barcodeTableAdapter;

	private BindingNavigator barcodeBindingNavigator;

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

	private DataGridView barcodeDataGridView;

	private TabControl tabControl;

	private TabPage basicPage;

	private TextBox nameTextBox;

	private TabPage subPage;

	private ComboBox checkComboBox;

	private ComboBox formatComboBox;

	private NumericUpDown barIDNumericUpDown;

	private NumericUpDown num2NumericUpDown;

	private NumericUpDown num1NumericUpDown;

	private BindingSource barcodeCheckBindingSource;

	private UIDataSet uIDataSet;

	private BindingSource barcodeFormatBindingSource;

	private ToolStripButton bindingNavigatorGoto;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripTextBox bindingNavigatorID;

	private ToolStripButton bindingNavigatorFilter;

	private Panel view_basicpage_panel;

	private Panel edit_basicpage_panel;

	private Label label_ViewOnly3;

	private Label label_ViewOnly1;

	private Label label_ViewOnly2;

	private Label label1;

	private Label label2;

	private Label label3;

	private Panel view_subpage_panel;

	private Label label4;

	private Label label5;

	private Label label6;

	private ToolStripButton P0_TMSFile_toolStripButton;

	private ToolStripButton P0_Ethernet_toolStripButton;

	private TableLayoutPanel BarSub_TableLayoutPanel;

	private Panel Info_Panel;

	private NumericUpDown BarNum_NumericUpDown;

	private Label Version_Error_Label;

	private Label TE_label;

	private TextBox TChar_TextBox;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn5;

	private DataGridViewComboBoxColumn dataGridViewTextBoxColumn2;

	private DataGridViewComboBoxColumn dataGridViewTextBoxColumn3;

	private Label nameLabel;

	private Label num2Label1;

	private Label num1Label1;

	private Label barIDLabel1;

	private Label checkLabel1;

	private Label formatLabel1;

	private Label Group_Label;

	public BarcodeForm()
	{
		InitializeComponent();
	}

	private ECSDataSet.BarcodeRow GetCurrentRow()
	{
		if (barcodeBindingSource.Position == -1)
		{
			return null;
		}
		DataRowView dataRowView = (DataRowView)barcodeBindingSource.Current;
		return (ECSDataSet.BarcodeRow)dataRowView.Row;
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
		}
		else if (Type == "Barcode")
		{
			NoCTRowChanged = true;
			eCSDataSet.Barcode.Clear();
			barcodeTableAdapter.Fill(eCSDataSet.Barcode);
			barcodeBindingSource.ResetBindings(metadataChanged: false);
			NoCTRowChanged = false;
		}
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "BarcodeForm");
	}

	private void BarForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_Barcode");
		barIDLabel1.Text = Program.GetLang("pw_Number") + ":";
		basicPage.Text = Program.GetLang("pw_BasicInfo");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorFilter.Text = Program.GetLang("pw_Filter");
		bindingNavigatorGoto.Text = Program.GetLang("pw_Switchto");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		bindingNavigatorPositionItem.ToolTipText = Program.GetLang("pw_Current");
		checkLabel1.Text = Program.GetLang("pw_Checkout") + ":";
		dataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Number");
		dataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_Type");
		dataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_Checkout");
		dataGridViewTextBoxColumn5.HeaderText = Program.GetLang("pw_Name");
		formatLabel1.Text = Program.GetLang("pw_Type") + ":";
		Group_Label.Text = Program.GetLang("pw_Group");
		label_ViewOnly1.Text = Program.GetLang("pw_ViewOnly");
		label_ViewOnly2.Text = string.Format(Program.GetLang("pw_CustomIDmustbetween10_29"), Settings.Default.minUserBarcodeID, 99);
		label_ViewOnly3.Text = Program.GetLang("pw_Clicktoaddnew");
		label4.Text = Program.GetLang("pw_Clicktoaddnew");
		label5.Text = Program.GetLang("pw_ViewOnly");
		label6.Text = string.Format(Program.GetLang("pw_CustomIDmustbetween10_29"), Settings.Default.minUserBarcodeID, 99);
		nameLabel.Text = Program.GetLang("pw_Name") + ":";
		num1Label1.Text = Program.GetLang("pw_Constant1_cl_");
		num2Label1.Text = Program.GetLang("pw_Constant2_cl_");
		P0_Ethernet_toolStripButton.Text = Program.GetLang("pw_Ethernet");
		P0_TMSFile_toolStripButton.Text = Program.GetLang("pw_TMSFile");
		subPage.Text = Program.GetLang("pw_DetailInfo");
		Version_Error_Label.Text = Program.GetLang("pw_SupportbydeviceafterV238A");
		Font = Settings.Default.CustomFont;
		if (Program.right == Program.Right.User)
		{
			barcodeBindingSource.Filter = "BarID >= 1";
		}
		BarItemBox = new BarItemBox[32];
		for (int i = 0; i < 32; i++)
		{
			BarItemBox[i] = new BarItemBox(Program.GetLang("pw_Sort") + ":", Program.GetLang("pw_Detail_sl_"), Program.GetLang("pw_Length_sl_"), Program.GetLang("pw_Shift_sl_"), Program.GetLang("pw_Overflow_sl_"), Program.GetLang("pw_Detail_sl_"), Program.GetLang("pw_Source_sl_"), Program.GetLang("pw_Detail_sl_"));
			BarItemBox[i].UserControlBtnClicked += TChar_Changed;
			BarSub_TableLayoutPanel.Controls.Add(BarItemBox[i], 0, 2 + i);
		}
		string fileName = Application.StartupPath + "\\Combo.xml";
		uIDataSet.Barcode_Format.ReadXml(fileName);
		uIDataSet.Barcode_Check.ReadXml(fileName);
		uIDataSet.Barcode_Source.ReadXml(fileName);
		uIDataSet.Barcode_Over.ReadXml(fileName);
		Program.LabelRight_SetXLocaltion(new Label[6] { barIDLabel1, nameLabel, formatLabel1, checkLabel1, num1Label1, num2Label1 }, new Control[6] { barIDNumericUpDown, nameTextBox, formatComboBox, checkComboBox, num1NumericUpDown, num2NumericUpDown });
		barcodeTableAdapter.Fill(eCSDataSet.Barcode);
		eCSDataSet.Barcode.BarcodeRowChanged += Barcode_BarcodeRowChanged;
		eCSDataSet.Barcode.ColumnChanging += Barcode_ColumnChanging;
		BarNum_NumericUpDown_ValueChanged();
	}

	private void Barcode_ColumnChanging(object sender, DataColumnChangeEventArgs e)
	{
		int num = ((Program.right != Program.Right.User) ? 1 : Settings.Default.minUserBarcodeID);
		if ((int)e.Row["BarID"] < num)
		{
			e.ProposedValue = e.Row[e.Column.Caption];
		}
		else if (!(e.Column.Caption != "BarID"))
		{
			int num2 = (int)e.ProposedValue;
			if (num2 > Settings.Default.maxBarcodeID || num2 < num)
			{
				e.ProposedValue = e.Row["BarID"];
			}
			try
			{
				barcodeTableAdapter.Update(eCSDataSet.Barcode);
				DataSet_Changed = true;
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void Barcode_BarcodeRowChanged(object sender, ECSDataSet.BarcodeRowChangeEvent e)
	{
		if (NoCTRowChanged || e.Action == DataRowAction.Rollback || e.Action == DataRowAction.Commit)
		{
			return;
		}
		if (e.Row.BarID > Settings.Default.maxBarcodeID)
		{
			e.Row.RejectChanges();
			return;
		}
		if (e.Row.BarID < Settings.Default.minUserBarcodeID && Program.right == Program.Right.User)
		{
			e.Row.RejectChanges();
			return;
		}
		try
		{
			barcodeTableAdapter.Update(eCSDataSet.Barcode);
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
			barcodeBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			barcodeBindingSource.CancelEdit();
		}
		if (eCSDataSet.HasChanges())
		{
			try
			{
				barcodeTableAdapter.Update(eCSDataSet.Barcode);
				DataSet_Changed = true;
			}
			catch (Exception ex2)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void BarcodeForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		eCSDataSet.Barcode.ColumnChanging -= Barcode_ColumnChanging;
		eCSDataSet.Barcode.BarcodeRowChanged -= Barcode_BarcodeRowChanged;
		Select(directed: true, forward: true);
		SaveData();
	}

	private void barcodeComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["Value"], dataRowView["Display"]);
		}
	}

	private void sourceComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			char c = (char)(65 + (int)dataRowView["Value"]);
			e.Value = string.Format("{0} - {1}", c, dataRowView["Display"]);
		}
	}

	private void bindingNavigatorGoto_Click(object sender, EventArgs e)
	{
		if (bindingNavigatorID.Text.Length != 0)
		{
			int num = barcodeBindingSource.Find("BarID", bindingNavigatorID.Text);
			if (num != -1)
			{
				barcodeBindingSource.Position = num;
			}
		}
	}

	private void bindingNavigatorFilter_CheckedChanged(object sender, EventArgs e)
	{
		if (bindingNavigatorFilter.Checked)
		{
			using (FilterForm filterForm = new FilterForm(barcodeDataGridView))
			{
				if (filterForm.ShowDialog(this) == DialogResult.OK)
				{
					barcodeBindingSource.Filter = filterForm.FilterString;
				}
				else
				{
					bindingNavigatorFilter.Checked = false;
				}
				return;
			}
		}
		barcodeBindingSource.RemoveFilter();
	}

	private void barcodeDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void barcodeBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
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

	private void barcodeBindingSource_CurrentChanged(object sender, EventArgs e)
	{
		bool flag = false;
		ECSDataSet.BarcodeRow currentRow = GetCurrentRow();
		if (currentRow != null && currentRow.BarID >= Settings.Default.minUserBarcodeID)
		{
			flag = true;
		}
		if (Program.right != Program.Right.User)
		{
			flag = true;
		}
		if (currentRow == null)
		{
			return;
		}
		Panel panel = edit_basicpage_panel;
		bool enabled = (BarSub_TableLayoutPanel.Enabled = flag);
		panel.Enabled = enabled;
		view_basicpage_panel.Visible = !flag;
		view_subpage_panel.Visible = false;
		int num = 6;
		string Sin = currentRow.TChar;
		for (int i = 0; i < 32; i++)
		{
			TChar_In = true;
			BarItemBox[i].BarInit(ref Sin);
			TChar_In = false;
			if (BarItemBox[i].GetN1() != 0)
			{
				num = i + 1;
			}
		}
		if (num < 6)
		{
			num = 6;
		}
		BarNum_NumericUpDown.Value = num;
	}

	private void barcodeNewRow(object sender, EventArgs e)
	{
		barcodeBindingSource.AddNew();
	}

	private void P0_TMSFile_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.ShowDialog_TMSfile_Hold(Wizard: false, Spec: false, String: false, Barcode: true, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
	}

	private void P0_Ethernet_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.PopMdiChild_Ethernet_Hold(Wizard: false, Spec: false, String: false, Barcode: true, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
		if (Program.mf.m_netForm.mf_Docked)
		{
			base.WindowState = FormWindowState.Normal;
			Close();
		}
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
			TChar_TextBox.Text = text;
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
		BarSub_TableLayoutPanel.Size = new Size(BarSub_TableLayoutPanel.Size.Width, TE_label.Location.Y + TE_label.Size.Height);
	}

	private void BarNum_NumericUpDown_ValueChanged(object sender, EventArgs e)
	{
		BarNum_NumericUpDown_ValueChanged();
		TChar_Changed();
	}

	private void BarcodeForm_Leave(object sender, EventArgs e)
	{
		barcodeDataGridView.EndEdit();
		barcodeBindingSource.EndEdit();
		if (DataSet_Changed)
		{
			DataSet_Update("Barcode");
			DataSet_Changed = false;
		}
	}

	private void DeleteCurrent()
	{
		ECSDataSet.BarcodeRow currentRow = GetCurrentRow();
		if (currentRow != null && (Program.right != Program.Right.User || currentRow.BarID >= Settings.Default.minUserLabelID))
		{
			barcodeDataGridView.Rows.Remove(barcodeDataGridView.CurrentRow);
			try
			{
				barcodeTableAdapter.Update(eCSDataSet.Barcode);
				DataSet_Changed = true;
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void bindingNavigatorDeleteItem_Click(object sender, EventArgs e)
	{
		DeleteCurrent();
	}

	private void barcodeDataGridView_KeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode == Keys.Delete)
		{
			e.Handled = true;
			DeleteCurrent();
		}
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.BarcodeForm));
		this.splitContainer = new System.Windows.Forms.SplitContainer();
		this.barcodeDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn5 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.barcodeFormatBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uIDataSet = new ECS.UIDataSet();
		this.dataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.barcodeCheckBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.barcodeBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.eCSDataSet = new ECS.ECSDataSet();
		this.tabControl = new System.Windows.Forms.TabControl();
		this.basicPage = new System.Windows.Forms.TabPage();
		this.view_basicpage_panel = new System.Windows.Forms.Panel();
		this.label_ViewOnly3 = new System.Windows.Forms.Label();
		this.label_ViewOnly1 = new System.Windows.Forms.Label();
		this.label_ViewOnly2 = new System.Windows.Forms.Label();
		this.edit_basicpage_panel = new System.Windows.Forms.Panel();
		this.barIDNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.num2Label1 = new System.Windows.Forms.Label();
		this.nameTextBox = new System.Windows.Forms.TextBox();
		this.num2NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.nameLabel = new System.Windows.Forms.Label();
		this.num1Label1 = new System.Windows.Forms.Label();
		this.barIDLabel1 = new System.Windows.Forms.Label();
		this.num1NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.formatComboBox = new System.Windows.Forms.ComboBox();
		this.checkLabel1 = new System.Windows.Forms.Label();
		this.formatLabel1 = new System.Windows.Forms.Label();
		this.checkComboBox = new System.Windows.Forms.ComboBox();
		this.subPage = new System.Windows.Forms.TabPage();
		this.BarSub_TableLayoutPanel = new System.Windows.Forms.TableLayoutPanel();
		this.view_subpage_panel = new System.Windows.Forms.Panel();
		this.label4 = new System.Windows.Forms.Label();
		this.label5 = new System.Windows.Forms.Label();
		this.label6 = new System.Windows.Forms.Label();
		this.Info_Panel = new System.Windows.Forms.Panel();
		this.Group_Label = new System.Windows.Forms.Label();
		this.BarNum_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.Version_Error_Label = new System.Windows.Forms.Label();
		this.TE_label = new System.Windows.Forms.Label();
		this.TChar_TextBox = new System.Windows.Forms.TextBox();
		this.barcodeBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorID = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorGoto = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorFilter = new System.Windows.Forms.ToolStripButton();
		this.P0_TMSFile_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.P0_Ethernet_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.barcodeTableAdapter = new ECS.ECSDataSetTableAdapters.BarcodeTableAdapter();
		this.label1 = new System.Windows.Forms.Label();
		this.label2 = new System.Windows.Forms.Label();
		this.label3 = new System.Windows.Forms.Label();
		this.splitContainer.Panel1.SuspendLayout();
		this.splitContainer.Panel2.SuspendLayout();
		this.splitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.barcodeDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeFormatBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeCheckBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		this.tabControl.SuspendLayout();
		this.basicPage.SuspendLayout();
		this.view_basicpage_panel.SuspendLayout();
		this.edit_basicpage_panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.barIDNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.num2NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.num1NumericUpDown).BeginInit();
		this.subPage.SuspendLayout();
		this.BarSub_TableLayoutPanel.SuspendLayout();
		this.view_subpage_panel.SuspendLayout();
		this.Info_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.BarNum_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingNavigator).BeginInit();
		this.barcodeBindingNavigator.SuspendLayout();
		base.SuspendLayout();
		this.splitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer, "splitContainer");
		this.splitContainer.Name = "splitContainer";
		resources.ApplyResources(this.splitContainer.Panel1, "splitContainer.Panel1");
		this.splitContainer.Panel1.Controls.Add(this.barcodeDataGridView);
		this.splitContainer.Panel2.Controls.Add(this.tabControl);
		this.barcodeDataGridView.AllowUserToAddRows = false;
		this.barcodeDataGridView.AutoGenerateColumns = false;
		this.barcodeDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.barcodeDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.None;
		this.barcodeDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn1, this.dataGridViewTextBoxColumn5, this.dataGridViewTextBoxColumn2, this.dataGridViewTextBoxColumn3);
		this.barcodeDataGridView.DataSource = this.barcodeBindingSource;
		resources.ApplyResources(this.barcodeDataGridView, "barcodeDataGridView");
		this.barcodeDataGridView.Name = "barcodeDataGridView";
		this.barcodeDataGridView.RowTemplate.Height = 23;
		this.barcodeDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.barcodeDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(barcodeDataGridView_DataError);
		this.barcodeDataGridView.KeyDown += new System.Windows.Forms.KeyEventHandler(barcodeDataGridView_KeyDown);
		this.dataGridViewTextBoxColumn1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn1.DataPropertyName = "BarID";
		resources.ApplyResources(this.dataGridViewTextBoxColumn1, "dataGridViewTextBoxColumn1");
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.dataGridViewTextBoxColumn5.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn5.DataPropertyName = "Name";
		resources.ApplyResources(this.dataGridViewTextBoxColumn5, "dataGridViewTextBoxColumn5");
		this.dataGridViewTextBoxColumn5.Name = "dataGridViewTextBoxColumn5";
		this.dataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn2.DataPropertyName = "Format";
		this.dataGridViewTextBoxColumn2.DataSource = this.barcodeFormatBindingSource;
		this.dataGridViewTextBoxColumn2.DisplayMember = "Display";
		resources.ApplyResources(this.dataGridViewTextBoxColumn2, "dataGridViewTextBoxColumn2");
		this.dataGridViewTextBoxColumn2.Name = "dataGridViewTextBoxColumn2";
		this.dataGridViewTextBoxColumn2.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.dataGridViewTextBoxColumn2.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.dataGridViewTextBoxColumn2.ValueMember = "Value";
		this.barcodeFormatBindingSource.DataMember = "Barcode_Format";
		this.barcodeFormatBindingSource.DataSource = this.uIDataSet;
		this.barcodeFormatBindingSource.Filter = "[Display] <> '#NULL#'";
		this.barcodeFormatBindingSource.Sort = "Value";
		this.uIDataSet.DataSetName = "UIDataSet";
		this.uIDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uIDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.dataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn3.DataPropertyName = "Check";
		this.dataGridViewTextBoxColumn3.DataSource = this.barcodeCheckBindingSource;
		this.dataGridViewTextBoxColumn3.DisplayMember = "Display";
		resources.ApplyResources(this.dataGridViewTextBoxColumn3, "dataGridViewTextBoxColumn3");
		this.dataGridViewTextBoxColumn3.Name = "dataGridViewTextBoxColumn3";
		this.dataGridViewTextBoxColumn3.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.dataGridViewTextBoxColumn3.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.dataGridViewTextBoxColumn3.ValueMember = "Value";
		this.barcodeCheckBindingSource.DataMember = "Barcode_Check";
		this.barcodeCheckBindingSource.DataSource = this.uIDataSet;
		this.barcodeCheckBindingSource.Sort = "Value";
		this.barcodeBindingSource.DataMember = "Barcode";
		this.barcodeBindingSource.DataSource = this.eCSDataSet;
		this.barcodeBindingSource.Filter = "";
		this.barcodeBindingSource.Sort = "";
		this.barcodeBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(barcodeBindingSource_BindingComplete);
		this.barcodeBindingSource.CurrentChanged += new System.EventHandler(barcodeBindingSource_CurrentChanged);
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.tabControl.Controls.Add(this.basicPage);
		this.tabControl.Controls.Add(this.subPage);
		resources.ApplyResources(this.tabControl, "tabControl");
		this.tabControl.Name = "tabControl";
		this.tabControl.SelectedIndex = 0;
		resources.ApplyResources(this.basicPage, "basicPage");
		this.basicPage.Controls.Add(this.view_basicpage_panel);
		this.basicPage.Controls.Add(this.edit_basicpage_panel);
		this.basicPage.Name = "basicPage";
		this.basicPage.UseVisualStyleBackColor = true;
		this.view_basicpage_panel.Controls.Add(this.label_ViewOnly3);
		this.view_basicpage_panel.Controls.Add(this.label_ViewOnly1);
		this.view_basicpage_panel.Controls.Add(this.label_ViewOnly2);
		resources.ApplyResources(this.view_basicpage_panel, "view_basicpage_panel");
		this.view_basicpage_panel.Name = "view_basicpage_panel";
		resources.ApplyResources(this.label_ViewOnly3, "label_ViewOnly3");
		this.label_ViewOnly3.BackColor = System.Drawing.Color.Transparent;
		this.label_ViewOnly3.Cursor = System.Windows.Forms.Cursors.Hand;
		this.label_ViewOnly3.ForeColor = System.Drawing.Color.Firebrick;
		this.label_ViewOnly3.Name = "label_ViewOnly3";
		this.label_ViewOnly3.Click += new System.EventHandler(barcodeNewRow);
		resources.ApplyResources(this.label_ViewOnly1, "label_ViewOnly1");
		this.label_ViewOnly1.BackColor = System.Drawing.Color.Transparent;
		this.label_ViewOnly1.ForeColor = System.Drawing.Color.Firebrick;
		this.label_ViewOnly1.Name = "label_ViewOnly1";
		resources.ApplyResources(this.label_ViewOnly2, "label_ViewOnly2");
		this.label_ViewOnly2.BackColor = System.Drawing.Color.Transparent;
		this.label_ViewOnly2.ForeColor = System.Drawing.Color.Firebrick;
		this.label_ViewOnly2.Name = "label_ViewOnly2";
		this.edit_basicpage_panel.Controls.Add(this.barIDNumericUpDown);
		this.edit_basicpage_panel.Controls.Add(this.num2Label1);
		this.edit_basicpage_panel.Controls.Add(this.nameTextBox);
		this.edit_basicpage_panel.Controls.Add(this.num2NumericUpDown);
		this.edit_basicpage_panel.Controls.Add(this.nameLabel);
		this.edit_basicpage_panel.Controls.Add(this.num1Label1);
		this.edit_basicpage_panel.Controls.Add(this.barIDLabel1);
		this.edit_basicpage_panel.Controls.Add(this.num1NumericUpDown);
		this.edit_basicpage_panel.Controls.Add(this.formatComboBox);
		this.edit_basicpage_panel.Controls.Add(this.checkLabel1);
		this.edit_basicpage_panel.Controls.Add(this.formatLabel1);
		this.edit_basicpage_panel.Controls.Add(this.checkComboBox);
		resources.ApplyResources(this.edit_basicpage_panel, "edit_basicpage_panel");
		this.edit_basicpage_panel.Name = "edit_basicpage_panel";
		this.barIDNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.barcodeBindingSource, "BarID", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.barIDNumericUpDown, "barIDNumericUpDown");
		this.barIDNumericUpDown.Maximum = new decimal(new int[4] { 99, 0, 0, 0 });
		this.barIDNumericUpDown.Name = "barIDNumericUpDown";
		resources.ApplyResources(this.num2Label1, "num2Label1");
		this.num2Label1.Name = "num2Label1";
		this.nameTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.barcodeBindingSource, "Name", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.nameTextBox, "nameTextBox");
		this.nameTextBox.Name = "nameTextBox";
		this.num2NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.barcodeBindingSource, "Num2", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.num2NumericUpDown, "num2NumericUpDown");
		this.num2NumericUpDown.Maximum = new decimal(new int[4] { 999999999, 0, 0, 0 });
		this.num2NumericUpDown.Name = "num2NumericUpDown";
		resources.ApplyResources(this.nameLabel, "nameLabel");
		this.nameLabel.Name = "nameLabel";
		resources.ApplyResources(this.num1Label1, "num1Label1");
		this.num1Label1.Name = "num1Label1";
		resources.ApplyResources(this.barIDLabel1, "barIDLabel1");
		this.barIDLabel1.Name = "barIDLabel1";
		this.num1NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.barcodeBindingSource, "Num1", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.num1NumericUpDown, "num1NumericUpDown");
		this.num1NumericUpDown.Maximum = new decimal(new int[4] { 999999999, 0, 0, 0 });
		this.num1NumericUpDown.Name = "num1NumericUpDown";
		this.formatComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.barcodeBindingSource, "Format", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.formatComboBox.DataSource = this.barcodeFormatBindingSource;
		this.formatComboBox.DisplayMember = "Display";
		this.formatComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.formatComboBox.DropDownWidth = 200;
		this.formatComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.formatComboBox, "formatComboBox");
		this.formatComboBox.Name = "formatComboBox";
		this.formatComboBox.ValueMember = "Value";
		this.formatComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(barcodeComboBox_Format);
		resources.ApplyResources(this.checkLabel1, "checkLabel1");
		this.checkLabel1.Name = "checkLabel1";
		resources.ApplyResources(this.formatLabel1, "formatLabel1");
		this.formatLabel1.Name = "formatLabel1";
		this.checkComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.barcodeBindingSource, "Check", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.checkComboBox.DataSource = this.barcodeCheckBindingSource;
		this.checkComboBox.DisplayMember = "Display";
		this.checkComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.checkComboBox.DropDownWidth = 200;
		this.checkComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.checkComboBox, "checkComboBox");
		this.checkComboBox.Name = "checkComboBox";
		this.checkComboBox.ValueMember = "Value";
		this.checkComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(barcodeComboBox_Format);
		resources.ApplyResources(this.subPage, "subPage");
		this.subPage.Controls.Add(this.BarSub_TableLayoutPanel);
		this.subPage.Name = "subPage";
		this.subPage.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.BarSub_TableLayoutPanel, "BarSub_TableLayoutPanel");
		this.BarSub_TableLayoutPanel.Controls.Add(this.view_subpage_panel, 0, 0);
		this.BarSub_TableLayoutPanel.Controls.Add(this.Info_Panel, 0, 1);
		this.BarSub_TableLayoutPanel.Controls.Add(this.TE_label, 0, 35);
		this.BarSub_TableLayoutPanel.Controls.Add(this.TChar_TextBox, 0, 34);
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
		this.label4.Click += new System.EventHandler(barcodeNewRow);
		resources.ApplyResources(this.label5, "label5");
		this.label5.BackColor = System.Drawing.Color.Transparent;
		this.label5.ForeColor = System.Drawing.Color.Firebrick;
		this.label5.Name = "label5";
		resources.ApplyResources(this.label6, "label6");
		this.label6.BackColor = System.Drawing.Color.Transparent;
		this.label6.ForeColor = System.Drawing.Color.Firebrick;
		this.label6.Name = "label6";
		this.Info_Panel.Controls.Add(this.Group_Label);
		this.Info_Panel.Controls.Add(this.BarNum_NumericUpDown);
		this.Info_Panel.Controls.Add(this.Version_Error_Label);
		resources.ApplyResources(this.Info_Panel, "Info_Panel");
		this.Info_Panel.Name = "Info_Panel";
		resources.ApplyResources(this.Group_Label, "Group_Label");
		this.Group_Label.Name = "Group_Label";
		resources.ApplyResources(this.BarNum_NumericUpDown, "BarNum_NumericUpDown");
		this.BarNum_NumericUpDown.Maximum = new decimal(new int[4] { 32, 0, 0, 0 });
		this.BarNum_NumericUpDown.Minimum = new decimal(new int[4] { 6, 0, 0, 0 });
		this.BarNum_NumericUpDown.Name = "BarNum_NumericUpDown";
		this.BarNum_NumericUpDown.Value = new decimal(new int[4] { 6, 0, 0, 0 });
		this.BarNum_NumericUpDown.ValueChanged += new System.EventHandler(BarNum_NumericUpDown_ValueChanged);
		resources.ApplyResources(this.Version_Error_Label, "Version_Error_Label");
		this.Version_Error_Label.BackColor = System.Drawing.Color.Transparent;
		this.Version_Error_Label.ForeColor = System.Drawing.Color.Firebrick;
		this.Version_Error_Label.Name = "Version_Error_Label";
		resources.ApplyResources(this.TE_label, "TE_label");
		this.TE_label.Name = "TE_label";
		this.TChar_TextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.barcodeBindingSource, "TChar", true));
		resources.ApplyResources(this.TChar_TextBox, "TChar_TextBox");
		this.TChar_TextBox.Name = "TChar_TextBox";
		this.barcodeBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem;
		this.barcodeBindingNavigator.BindingSource = this.barcodeBindingSource;
		this.barcodeBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.barcodeBindingNavigator.DeleteItem = null;
		this.barcodeBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[17]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem, this.toolStripSeparator1, this.bindingNavigatorID, this.bindingNavigatorGoto, this.bindingNavigatorFilter, this.P0_TMSFile_toolStripButton, this.P0_Ethernet_toolStripButton
		});
		resources.ApplyResources(this.barcodeBindingNavigator, "barcodeBindingNavigator");
		this.barcodeBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.barcodeBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.barcodeBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.barcodeBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.barcodeBindingNavigator.Name = "barcodeBindingNavigator";
		this.barcodeBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorAddNewItem.Image = ECS.Properties.Resources.bindingNavigatorAddNewItem;
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
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
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorDeleteItem.Image = ECS.Properties.Resources.bindingNavigatorDeleteItem;
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
		this.bindingNavigatorDeleteItem.Click += new System.EventHandler(bindingNavigatorDeleteItem_Click);
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		this.bindingNavigatorID.Name = "bindingNavigatorID";
		resources.ApplyResources(this.bindingNavigatorID, "bindingNavigatorID");
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
		resources.ApplyResources(this.P0_TMSFile_toolStripButton, "P0_TMSFile_toolStripButton");
		this.P0_TMSFile_toolStripButton.Name = "P0_TMSFile_toolStripButton";
		this.P0_TMSFile_toolStripButton.Click += new System.EventHandler(P0_TMSFile_toolStripButton_Click);
		resources.ApplyResources(this.P0_Ethernet_toolStripButton, "P0_Ethernet_toolStripButton");
		this.P0_Ethernet_toolStripButton.Name = "P0_Ethernet_toolStripButton";
		this.P0_Ethernet_toolStripButton.Click += new System.EventHandler(P0_Ethernet_toolStripButton_Click);
		this.barcodeTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this.label1, "label1");
		this.label1.BackColor = System.Drawing.Color.Transparent;
		this.label1.Cursor = System.Windows.Forms.Cursors.Hand;
		this.label1.ForeColor = System.Drawing.SystemColors.ControlText;
		this.label1.Name = "label1";
		resources.ApplyResources(this.label2, "label2");
		this.label2.BackColor = System.Drawing.Color.Transparent;
		this.label2.ForeColor = System.Drawing.SystemColors.ControlText;
		this.label2.Name = "label2";
		resources.ApplyResources(this.label3, "label3");
		this.label3.BackColor = System.Drawing.Color.Transparent;
		this.label3.ForeColor = System.Drawing.SystemColors.ControlText;
		this.label3.Name = "label3";
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer);
		base.Controls.Add(this.barcodeBindingNavigator);
		base.Name = "BarcodeForm";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(BarcodeForm_FormClosing);
		base.Load += new System.EventHandler(BarForm_Load);
		base.Leave += new System.EventHandler(BarcodeForm_Leave);
		this.splitContainer.Panel1.ResumeLayout(false);
		this.splitContainer.Panel2.ResumeLayout(false);
		this.splitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.barcodeDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeFormatBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeCheckBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		this.tabControl.ResumeLayout(false);
		this.basicPage.ResumeLayout(false);
		this.view_basicpage_panel.ResumeLayout(false);
		this.view_basicpage_panel.PerformLayout();
		this.edit_basicpage_panel.ResumeLayout(false);
		this.edit_basicpage_panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.barIDNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.num2NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.num1NumericUpDown).EndInit();
		this.subPage.ResumeLayout(false);
		this.BarSub_TableLayoutPanel.ResumeLayout(false);
		this.BarSub_TableLayoutPanel.PerformLayout();
		this.view_subpage_panel.ResumeLayout(false);
		this.view_subpage_panel.PerformLayout();
		this.Info_Panel.ResumeLayout(false);
		this.Info_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.BarNum_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeBindingNavigator).EndInit();
		this.barcodeBindingNavigator.ResumeLayout(false);
		this.barcodeBindingNavigator.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
