using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class SelForm : Form
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

	private IContainer components;

	private ECSDataSet eCSDataSet;

	private BindingSource pLUBindingSource;

	private PLUTableAdapter pLUTableAdapter;

	private Button okButton;

	private DataGridView pLUDataGridView;

	private Button cancelButton;

	private UIDataSet uiDataSet;

	private ComboBox Fuction_ComboBox;

	private RadioButton PLU_RadioButton;

	private RadioButton Function_RadioButton;

	private Label Version_Error_Label;

	private Button clearButton;

	private Panel panel1;

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

	private ToolStripTextBox bindingNavigatorID;

	private ToolStripDropDownButton gotoType_ToolStripDropDownButton;

	private ToolStripMenuItem numberToolStripMenuItem;

	private ToolStripMenuItem itemCodeToolStripMenuItem;

	private ToolStripMenuItem indexToolStripMenuItem;

	private ToolStripButton bindingNavigatorGoto;

	private ToolStripButton bindingNavigatorFilter;

	private ToolStripButton FilterAdd_ToolStripButton;

	private BindingSource unitBindingSource2;

	private DataGridViewTextBoxColumn pluidTextBoxColumn;

	private DataGridViewTextBoxColumn nameTextBoxColumn;

	private DataGridViewComboBoxColumn unitComboBoxColumn;

	private DataGridViewTextBoxColumn itemcodeTextBoxColumn;

	private DataGridViewTextBoxColumn indexTextBoxColumn;

	private DataGridViewTextBoxColumn priceTextBoxColumn;

	private DataGridViewTextBoxColumn costTextBoxColumn;

	private ToolStripMenuItem nameToolStripMenuItem;

	private SimComboVD_No[] ctFuc;

	private int _PLUID;

	private string SG_Filter_Value = "";

	private bool SG_Filter_FromMenu;

	public int PLU
	{
		get
		{
			return _PLUID;
		}
		set
		{
			_PLUID = value;
		}
	}

	public string SG_Filter
	{
		get
		{
			if (bindingNavigatorFilter.Checked)
			{
				return pLUBindingSource.Filter;
			}
			return "";
		}
		set
		{
			SG_Filter_Value = value;
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.SelForm));
		this.pLUBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.eCSDataSet = new ECS.ECSDataSet();
		this.pLUTableAdapter = new ECS.ECSDataSetTableAdapters.PLUTableAdapter();
		this.okButton = new System.Windows.Forms.Button();
		this.pLUDataGridView = new System.Windows.Forms.DataGridView();
		this.pluidTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.nameTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitComboBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.unitBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.itemcodeTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.indexTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.priceTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.costTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.cancelButton = new System.Windows.Forms.Button();
		this.uiDataSet = new ECS.UIDataSet();
		this.Fuction_ComboBox = new System.Windows.Forms.ComboBox();
		this.PLU_RadioButton = new System.Windows.Forms.RadioButton();
		this.Function_RadioButton = new System.Windows.Forms.RadioButton();
		this.Version_Error_Label = new System.Windows.Forms.Label();
		this.clearButton = new System.Windows.Forms.Button();
		this.panel1 = new System.Windows.Forms.Panel();
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
		this.bindingNavigatorID = new System.Windows.Forms.ToolStripTextBox();
		this.gotoType_ToolStripDropDownButton = new System.Windows.Forms.ToolStripDropDownButton();
		this.numberToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.itemCodeToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.indexToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.nameToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.bindingNavigatorGoto = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorFilter = new System.Windows.Forms.ToolStripButton();
		this.FilterAdd_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLUDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		this.panel1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingNavigator).BeginInit();
		this.pLUBindingNavigator.SuspendLayout();
		base.SuspendLayout();
		this.pLUBindingSource.DataMember = "PLU";
		this.pLUBindingSource.DataSource = this.eCSDataSet;
		this.pLUBindingSource.Sort = "PLUID";
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.pLUTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		this.okButton.Name = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.okButton.Click += new System.EventHandler(okButton_Click);
		this.pLUDataGridView.AllowUserToAddRows = false;
		this.pLUDataGridView.AllowUserToDeleteRows = false;
		this.pLUDataGridView.AutoGenerateColumns = false;
		this.pLUDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.pLUDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.pLUDataGridView.Columns.AddRange(this.pluidTextBoxColumn, this.nameTextBoxColumn, this.unitComboBoxColumn, this.itemcodeTextBoxColumn, this.indexTextBoxColumn, this.priceTextBoxColumn, this.costTextBoxColumn);
		this.pLUDataGridView.DataSource = this.pLUBindingSource;
		resources.ApplyResources(this.pLUDataGridView, "pLUDataGridView");
		this.pLUDataGridView.MultiSelect = false;
		this.pLUDataGridView.Name = "pLUDataGridView";
		this.pLUDataGridView.ReadOnly = true;
		this.pLUDataGridView.RowTemplate.Height = 23;
		this.pLUDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.pLUDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(pLUDataGridView_DataError);
		this.pLUDataGridView.DoubleClick += new System.EventHandler(pLUDataGridView_DoubleClick);
		this.pluidTextBoxColumn.DataPropertyName = "PLUID";
		this.pluidTextBoxColumn.FillWeight = 60f;
		resources.ApplyResources(this.pluidTextBoxColumn, "pluidTextBoxColumn");
		this.pluidTextBoxColumn.Name = "pluidTextBoxColumn";
		this.pluidTextBoxColumn.ReadOnly = true;
		this.nameTextBoxColumn.DataPropertyName = "Name";
		resources.ApplyResources(this.nameTextBoxColumn, "nameTextBoxColumn");
		this.nameTextBoxColumn.Name = "nameTextBoxColumn";
		this.nameTextBoxColumn.ReadOnly = true;
		this.unitComboBoxColumn.DataPropertyName = "UnitID";
		this.unitComboBoxColumn.DataSource = this.unitBindingSource2;
		this.unitComboBoxColumn.DisplayMember = "Name";
		resources.ApplyResources(this.unitComboBoxColumn, "unitComboBoxColumn");
		this.unitComboBoxColumn.Name = "unitComboBoxColumn";
		this.unitComboBoxColumn.ReadOnly = true;
		this.unitComboBoxColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.unitComboBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.unitComboBoxColumn.ValueMember = "UnitID";
		this.unitBindingSource2.DataMember = "Unit";
		this.unitBindingSource2.DataSource = this.eCSDataSet;
		this.unitBindingSource2.Filter = "";
		this.itemcodeTextBoxColumn.DataPropertyName = "Remark";
		resources.ApplyResources(this.itemcodeTextBoxColumn, "itemcodeTextBoxColumn");
		this.itemcodeTextBoxColumn.Name = "itemcodeTextBoxColumn";
		this.itemcodeTextBoxColumn.ReadOnly = true;
		this.indexTextBoxColumn.DataPropertyName = "Index";
		resources.ApplyResources(this.indexTextBoxColumn, "indexTextBoxColumn");
		this.indexTextBoxColumn.Name = "indexTextBoxColumn";
		this.indexTextBoxColumn.ReadOnly = true;
		this.priceTextBoxColumn.DataPropertyName = "Price";
		resources.ApplyResources(this.priceTextBoxColumn, "priceTextBoxColumn");
		this.priceTextBoxColumn.Name = "priceTextBoxColumn";
		this.priceTextBoxColumn.ReadOnly = true;
		this.costTextBoxColumn.DataPropertyName = "Cost";
		resources.ApplyResources(this.costTextBoxColumn, "costTextBoxColumn");
		this.costTextBoxColumn.Name = "costTextBoxColumn";
		this.costTextBoxColumn.ReadOnly = true;
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.Fuction_ComboBox, "Fuction_ComboBox");
		this.Fuction_ComboBox.FormattingEnabled = true;
		this.Fuction_ComboBox.Name = "Fuction_ComboBox";
		this.Fuction_ComboBox.Leave += new System.EventHandler(Fuction_ComboBox_Leave);
		resources.ApplyResources(this.PLU_RadioButton, "PLU_RadioButton");
		this.PLU_RadioButton.Name = "PLU_RadioButton";
		this.PLU_RadioButton.UseVisualStyleBackColor = true;
		this.PLU_RadioButton.CheckedChanged += new System.EventHandler(PLU_RadioButton_CheckedChanged);
		resources.ApplyResources(this.Function_RadioButton, "Function_RadioButton");
		this.Function_RadioButton.Name = "Function_RadioButton";
		this.Function_RadioButton.TabStop = true;
		this.Function_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Version_Error_Label, "Version_Error_Label");
		this.Version_Error_Label.BackColor = System.Drawing.Color.Transparent;
		this.Version_Error_Label.ForeColor = System.Drawing.Color.Firebrick;
		this.Version_Error_Label.Name = "Version_Error_Label";
		resources.ApplyResources(this.clearButton, "clearButton");
		this.clearButton.DialogResult = System.Windows.Forms.DialogResult.Ignore;
		this.clearButton.Name = "clearButton";
		this.clearButton.UseVisualStyleBackColor = true;
		this.panel1.Controls.Add(this.pLUDataGridView);
		this.panel1.Controls.Add(this.pLUBindingNavigator);
		resources.ApplyResources(this.panel1, "panel1");
		this.panel1.Name = "panel1";
		this.pLUBindingNavigator.AddNewItem = null;
		this.pLUBindingNavigator.BindingSource = this.pLUBindingSource;
		this.pLUBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.pLUBindingNavigator.DeleteItem = null;
		this.pLUBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[14]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorID,
			this.gotoType_ToolStripDropDownButton, this.bindingNavigatorGoto, this.bindingNavigatorFilter, this.FilterAdd_ToolStripButton
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
		this.bindingNavigatorID.Name = "bindingNavigatorID";
		resources.ApplyResources(this.bindingNavigatorID, "bindingNavigatorID");
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
		this.bindingNavigatorFilter.CheckStateChanged += new System.EventHandler(bindingNavigatorFilter_CheckStateChanged);
		this.FilterAdd_ToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.FilterAdd_ToolStripButton, "FilterAdd_ToolStripButton");
		this.FilterAdd_ToolStripButton.Name = "FilterAdd_ToolStripButton";
		this.FilterAdd_ToolStripButton.Click += new System.EventHandler(FilterAdd_ToolStripButton_Click);
		base.AcceptButton = this.okButton;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.CancelButton = this.cancelButton;
		base.Controls.Add(this.panel1);
		base.Controls.Add(this.Version_Error_Label);
		base.Controls.Add(this.Function_RadioButton);
		base.Controls.Add(this.PLU_RadioButton);
		base.Controls.Add(this.Fuction_ComboBox);
		base.Controls.Add(this.clearButton);
		base.Controls.Add(this.cancelButton);
		base.Controls.Add(this.okButton);
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "SelForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(SelForm_Load);
		((System.ComponentModel.ISupportInitialize)this.pLUBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLUDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		this.panel1.ResumeLayout(false);
		this.panel1.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingNavigator).EndInit();
		this.pLUBindingNavigator.ResumeLayout(false);
		this.pLUBindingNavigator.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public SelForm()
	{
		InitializeComponent();
	}

	private void SelForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_Select");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		clearButton.Text = Program.GetLang("pw_Clear");
		Function_RadioButton.Text = Program.GetLang("pw_FunctionKey");
		okButton.Text = Program.GetLang("pw_OK");
		PLU_RadioButton.Text = Program.GetLang("pw_PLUKey");
		Version_Error_Label.Text = Program.GetLang("pw_SupportbydeviceafterV238B");
		numberToolStripMenuItem.Text = Program.GetLang("pw_Number");
		itemCodeToolStripMenuItem.Text = Program.GetLang("pw_ItemCode");
		indexToolStripMenuItem.Text = Program.GetLang("pw_IndexBarcode");
		nameToolStripMenuItem.Text = Program.GetLang("pw_Name");
		gotoType_ToolStripDropDownButton.Text = Program.GetLang("pw_Switchto");
		bindingNavigatorFilter.Text = Program.GetLang("pw_Filter");
		FilterAdd_ToolStripButton.Text = Program.GetLang("pw_Filter") + "+";
		bindingNavigatorGoto.Text = Program.GetLang("pw_Switchto");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		costTextBoxColumn.HeaderText = Program.GetLang("pw_Cost");
		pluidTextBoxColumn.HeaderText = Program.GetLang("pw_Number");
		nameTextBoxColumn.HeaderText = Program.GetLang("pw_Name");
		unitComboBoxColumn.HeaderText = Program.GetLang("pw_Unit");
		indexTextBoxColumn.HeaderText = Program.GetLang("pw_IndexBarcode");
		priceTextBoxColumn.HeaderText = Program.GetLang("pw_UPrice");
		itemcodeTextBoxColumn.HeaderText = Program.GetLang("pw_ItemCode");
		if (SG_Filter_Value.Length == 0)
		{
			bindingNavigatorFilter.Checked = false;
			FilterAdd_ToolStripButton.Visible = false;
			if (Program.right == Program.Right.User)
			{
				pLUBindingSource.Filter = "PLUID >= " + Settings.Default.minUserPLUID;
			}
		}
		else
		{
			SG_Filter_FromMenu = true;
			bindingNavigatorFilter.Checked = true;
			FilterAdd_ToolStripButton.Visible = true;
			SG_Filter_FromMenu = false;
			pLUBindingSource.Filter = SG_Filter_Value;
		}
		Font = Settings.Default.CustomFont;
		string fileName = Application.StartupPath + "\\Combo.xml";
		uiDataSet.ReadXml(fileName);
		string[] array = uiDataSet.SimCombo.FindByName("Shortcut Fuction").ValueDisplay.Split('|');
		ctFuc = new SimComboVD_No[array.Length / 2];
		for (int i = 0; i < array.Length / 2; i++)
		{
			SimComboVD_No simComboVD_No = new SimComboVD_No();
			simComboVD_No.Value = int.Parse(array[i * 2]);
			if (simComboVD_No.Value == 63)
			{
				simComboVD_No.Display = string.Format(array[i * 2 + 1], Program.GetLang_Plus("pw_Payment1"));
			}
			else if (simComboVD_No.Value == 64)
			{
				simComboVD_No.Display = string.Format(array[i * 2 + 1], Program.GetLang_Plus("pw_Payment2"));
			}
			else if (simComboVD_No.Value == 65)
			{
				simComboVD_No.Display = string.Format(array[i * 2 + 1], Program.GetLang_Plus("pw_Payment3"));
			}
			else
			{
				simComboVD_No.Display = array[i * 2 + 1];
			}
			simComboVD_No.Display = "(" + simComboVD_No.Value + ") " + simComboVD_No.Display;
			ctFuc[i] = simComboVD_No;
		}
		Fuction_ComboBox.ValueMember = "Value";
		Fuction_ComboBox.DisplayMember = "Display";
		Fuction_ComboBox.DataSource = ctFuc;
		pLUTableAdapter.Fill(eCSDataSet.PLU);
		if (_PLUID >= 0)
		{
			PLU_RadioButton.Checked = true;
			PLU_RadioButton_CheckedChanged();
			int num = pLUBindingSource.Find("PLUID", _PLUID);
			if (num != -1)
			{
				pLUBindingSource.Position = num;
			}
		}
		else
		{
			Function_RadioButton.Checked = true;
			PLU_RadioButton_CheckedChanged();
			Fuction_ComboBox.SelectedValue = -_PLUID;
		}
	}

	private void okButton_Click(object sender, EventArgs e)
	{
		try
		{
			if (PLU_RadioButton.Checked)
			{
				DataRowView dataRowView = (DataRowView)pLUBindingSource.Current;
				if (dataRowView == null)
				{
					_PLUID = 0;
					return;
				}
				ECSDataSet.PLURow pLURow = (ECSDataSet.PLURow)dataRowView.Row;
				if (pLURow == null)
				{
					_PLUID = 0;
				}
				else
				{
					_PLUID = pLURow.PLUID;
				}
			}
			else if (Function_RadioButton.Checked)
			{
				_PLUID = -(int)Fuction_ComboBox.SelectedValue;
			}
		}
		catch (Exception)
		{
			_PLUID = 0;
		}
	}

	private void PLU_RadioButton_CheckedChanged()
	{
		BindingNavigator bindingNavigator = pLUBindingNavigator;
		bool visible = (pLUDataGridView.Visible = PLU_RadioButton.Checked);
		bindingNavigator.Visible = visible;
		Fuction_ComboBox.Visible = Function_RadioButton.Checked;
	}

	private void PLU_RadioButton_CheckedChanged(object sender, EventArgs e)
	{
		PLU_RadioButton_CheckedChanged();
	}

	private void pLUDataGridView_DoubleClick(object sender, EventArgs e)
	{
		okButton.PerformClick();
	}

	private void Fuction_ComboBox_Leave(object sender, EventArgs e)
	{
		if (Fuction_ComboBox.SelectedIndex >= 0)
		{
			return;
		}
		for (int i = 0; i < Fuction_ComboBox.Items.Count; i++)
		{
			if (((SimComboVD_No)Fuction_ComboBox.Items[i]).Display == Fuction_ComboBox.Text)
			{
				Fuction_ComboBox.SelectedValue = ((SimComboVD_No)Fuction_ComboBox.Items[i]).Value;
				break;
			}
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

	private void bindingNavigatorFilter_CheckStateChanged(object sender, EventArgs e)
	{
		if (bindingNavigatorFilter.Checked)
		{
			if (!SG_Filter_FromMenu)
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
			FilterAdd_ToolStripButton.Visible = true;
		}
		else
		{
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

	private void pLUDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}
}
